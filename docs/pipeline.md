# AI Game Studio - Pipeline Workflow

This document describes the complete pipeline workflow for automated game production. When a user requests "게임 N개 만들어줘" (make N games), the system executes all 9 phases (Phase 0 through Phase 8) fully autonomously, from idea generation through deployment.

---

## Phase 0: Initialization

**Purpose**: Set up the agent team and notify stakeholders that production has begun.

### Steps

1. **Create Team**: Call `TeamCreate(team_name: "game-pipeline-YYYYMMDD-NNN")` to establish a new agent team instance. The team name includes the current date and a sequential run number for traceability.

2. **Slack Notification**: Send pipeline start notification via Slack MCP plugin.
   - Message: "게임 N개 제작 파이프라인 시작" (Game production pipeline started for N games)
   - Channel: configured project channel

3. **Spawn Meta Leaders**: Spawn 3 meta leader agents that oversee the entire pipeline.
   - **Director** (`agents/meta-leaders/director.md`): Creative vision and quality oversight
   - **Producer** (`agents/meta-leaders/producer.md`): Schedule and efficiency management
   - **Critic** (`agents/meta-leaders/critic.md`): Review and improvement analysis

### Agent Spawning Protocol

For each meta leader (and all subsequent agents):
1. Read the agent's prompt file from `agents/` using the `Read` tool.
2. Call the `Agent` tool with:
   - `prompt`: Contents of the prompt file combined with current context (task details, reference data)
   - `team_name`: The current pipeline team name
   - `name`: The agent's designated name (e.g., "director", "producer", "critic")
   - `subagent_type`: `"general-purpose"`

### Data Files Created

| File | Location | Description |
|------|----------|-------------|
| Run directory | `data/pipeline-runs/run-YYYY-MM-DD-NNN/` | Root directory for this pipeline run |

---

## Phase 1: Idea Generation (Parallel)

**Purpose**: Generate a pool of candidate game ideas using 3 ideator agents working in parallel.

### Steps

1. **Load Existing Ideas**: Read `data/ideas-database.json` to check for previously generated ideas and avoid duplicates.

2. **Set Generation Target**: Generate N x 3 raw ideas (3 ideas per requested game), providing a sufficient pool for validation filtering.

3. **Spawn Ideators (Parallel)**: Launch 3 ideator agents simultaneously, each with a distinct creative perspective:
   - **Spark** (`agents/ideators/spark.md`): Generates ideas rooted in proven game mechanics with creative twists. Focuses on solid core loops and reliable engagement patterns.
   - **Oddball** (`agents/ideators/oddball.md`): Generates unconventional and experimental ideas. Explores unusual mechanics, surprising themes, and novel combinations.
   - **Trendsetter** (`agents/ideators/trendsetter.md`): Generates ideas aligned with current gaming trends, viral mechanics, and market opportunities.

4. **Duplicate Detection**: Each generated idea is checked against the existing database:
   - **Title similarity**: Fuzzy matching against existing game titles
   - **Mechanic tag overlap**: Flag if 3 or more `mechanic_tags` overlap with an existing idea
   - **One-liner comparison**: Semantic similarity check against existing one-liners
   - If a duplicate is detected, the ideator regenerates a replacement idea.

5. **Save Raw Ideas**: Write all generated ideas to `data/pipeline-runs/run-XXX/ideas-raw.json` using the idea template format defined in `docs/templates/idea-template.json`.

6. **Slack Notification**: "아이디어 M개 생성 완료, 검증 시작" (M ideas generated, starting validation)

7. **Meta Leader Phase 1 Review**: Director, Producer, and Critic each independently review the idea pool quality, diversity, and alignment with production goals. They exchange feedback via `SendMessage` and reach consensus on whether to proceed or request additional ideas.

### Data Files Created

| File | Location | Description |
|------|----------|-------------|
| Raw ideas | `data/pipeline-runs/run-XXX/ideas-raw.json` | All generated ideas before validation |

---

## Phase 2: Idea Validation (4 Judges per Idea, Parallel)

**Purpose**: Evaluate each generated idea through 4 specialized judges using a weighted scoring system. Only ideas scoring 70+ proceed.

### Steps

1. **Spawn Idea Judges (Parallel per idea)**: For each idea, spawn 4 judge agents simultaneously:
   - **Professor Ludus** (`agents/idea-judges/professor-ludus.md`): Game Design expert, weight **0.35**
   - **Dr. Loop** (`agents/idea-judges/dr-loop.md`): Player Psychology expert, weight **0.25**
   - **Cash** (`agents/idea-judges/cash.md`): Monetization expert, weight **0.20**
   - **Scout** (`agents/idea-judges/scout.md`): Market Viability expert, weight **0.20**

2. **Scoring**: Each judge evaluates the idea against their domain-specific subcriteria (scored 1-10 each), calculates a category score (0-100), and provides qualitative feedback. The weighted sum of all 4 judges' category scores produces the final composite score.

3. **Gate Decision**:
   - **70+ points**: PASS -- idea proceeds to Phase 3 (Planning)
   - **Below 70**: FAIL -- idea is discarded

4. **Shortfall Handling**: If fewer than N ideas pass validation, the pipeline loops back to Phase 1 to generate additional ideas to fill the deficit. Only the shortfall count is regenerated.

5. **Save Evaluation Results**:
   - `data/pipeline-runs/run-XXX/ideas-evaluated.json`: All evaluations (pass and fail)
   - `data/pipeline-runs/run-XXX/ideas-passed.json`: Only passing ideas

6. **Slack Notification**: "K개 아이디어 통과, 기획 시작" (K ideas passed, starting planning)

### Data Files Created

| File | Location | Description |
|------|----------|-------------|
| All evaluations | `data/pipeline-runs/run-XXX/ideas-evaluated.json` | Complete evaluation data for every idea |
| Passed ideas | `data/pipeline-runs/run-XXX/ideas-passed.json` | Only ideas that scored 70+ |

---

## Phase 3: Planning

**Purpose**: Transform each validated idea into a comprehensive game design document.

### Steps

1. **Spawn Architect**: For each passed idea, spawn the **Architect** agent (`agents/planners/architect.md`) with the full idea data as context.

2. **Design Document Creation**: The Architect produces a detailed game design document following the template at `docs/templates/game-design-doc-template.md`. The document covers:
   - Overview and core concept
   - Detailed game mechanics and controls
   - Infinite stage system design
   - Visual and audio design specifications
   - UI/UX flow and HUD layout
   - Monetization strategy and ad placements
   - Technical architecture with file structure
   - Implementation notes and performance targets

3. **Tech Spec Compliance**: All plans must adhere to the project tech spec:
   - Engine: Phaser 3 (CDN), with PixiJS or vanilla Canvas as alternatives
   - Graphics: SVG generated in-code (no external image assets)
   - Target: Mobile web (360-428px width, touch-only controls)
   - File structure: `index.html` + `css/style.css` + `js/{config,main,game,stages,ui,ads}.js`
   - Constraint: Each JS file must stay under 300 lines, no npm or build step

4. **Save Plans**: Write each game design document to `data/pipeline-runs/run-XXX/plans/{slug}-plan.md`.

### Data Files Created

| File | Location | Description |
|------|----------|-------------|
| Game design docs | `data/pipeline-runs/run-XXX/plans/{slug}-plan.md` | One detailed plan per passed idea |

---

## Phase 4: Plan Validation (3 Judges per Plan, Parallel)

**Purpose**: Evaluate each game plan for technical feasibility, fun factor, and business viability. Plans scoring 70+ proceed to development.

### Steps

1. **Spawn Plan Judges (Parallel per plan)**: For each plan, spawn 3 judge agents simultaneously:
   - **Builder** (`agents/plan-judges/builder.md`): Technical Feasibility expert, weight **0.40**
   - **Joy** (`agents/plan-judges/joy.md`): Fun/Engagement expert, weight **0.35**
   - **Profit** (`agents/plan-judges/profit.md`): Business Viability expert, weight **0.25**

2. **Scoring**: Each judge evaluates the plan against their domain-specific subcriteria (scored 1-10 each), calculates a category score (0-100), and provides qualitative feedback with specific concerns and required changes. The weighted sum produces the final composite score.

3. **Gate Decision**:
   - **70+ points**: PASS -- plan proceeds to Phase 5 (Development)
   - **50-69 points**: REVISE -- feedback is compiled and sent back to the Architect for revision. The Architect modifies the plan and it is re-evaluated. Maximum of **2 revision rounds**. If the plan still scores below 70 after 2 revisions, it is scrapped.
   - **Below 50 points**: SCRAP -- plan is permanently discarded. If a backup idea exists, it replaces the scrapped plan.

4. **Save Evaluation Results**: Write evaluations to `data/pipeline-runs/run-XXX/plan-evaluations/{slug}-evaluation.json`.

5. **Slack Notification**: "J개 기획 통과, 개발 시작" (J plans passed, starting development)

6. **Meta Leader Phase 2-4 Review**: Director, Producer, and Critic review the cumulative results of idea validation and plan validation. They assess:
   - Overall quality of the surviving ideas and plans
   - Whether the pipeline parameters (weights, thresholds) need adjustment
   - Any systemic issues observed across multiple evaluations
   - Whether to proceed with development or intervene

### Data Files Created

| File | Location | Description |
|------|----------|-------------|
| Plan evaluations | `data/pipeline-runs/run-XXX/plan-evaluations/{slug}-evaluation.json` | Evaluation data per plan |

---

## Phase 5: Development

**Purpose**: Implement each validated game plan as a fully playable mobile web game.

### Steps

1. **Spawn Developer**: For each passed plan, spawn the **Developer** agent (`agents/developers/developer.md`) with the full game design document as context.

2. **Implementation**: The Developer creates the complete game in `games/{slug}/` with the following structure:
   ```
   games/{slug}/
   ├── index.html          # Entry point, loads all scripts via CDN and local files
   ├── css/
   │   └── style.css       # Responsive styles, mobile-first (360-428px)
   └── js/
       ├── config.js       # Game configuration, constants, difficulty tables
       ├── main.js         # Phaser game initialization, scene registration
       ├── game.js         # Core game scene, main game loop
       ├── stages.js       # Infinite stage generation, difficulty progression
       ├── ui.js           # Menu, HUD, game over, pause screens
       └── ads.js          # Ad integration hooks, reward system
   ```

3. **Implementation Requirements**:
   - Each JS file must stay under 300 lines
   - All graphics rendered via SVG generated in-code (no external image files)
   - CDN dependencies loaded via `<script>` tags (Phaser 3, optional Howler.js)
   - Touch controls only (no keyboard/mouse requirements)
   - No build step -- `index.html` must be directly openable in a browser

4. **Slack Notification**: "게임 '{title}' 개발 완료, 테스트 시작" (Game '{title}' development complete, starting testing)

### Data Files Created

| File | Location | Description |
|------|----------|-------------|
| Game files | `games/{slug}/` | Complete playable game |

---

## Phase 6: Testing + Bug Fix Loop

**Purpose**: Thoroughly test each developed game using Playwright-driven automated play testing. Fix bugs through iterative rounds.

### Steps

1. **Start Local Server**: Launch a local HTTP server to serve the game:
   ```bash
   npx http-server games/{slug} -p 8080
   ```

2. **Spawn Testers (Parallel)**: Launch 3 tester agents simultaneously, each using the Playwright MCP plugin for automated browser interaction:
   - **Player One** (`agents/testers/player-one.md`): Player Experience tester, weight **0.35**
   - **Bugcatcher** (`agents/testers/bugcatcher.md`): QA tester, weight **0.40**
   - **AdCheck** (`agents/testers/adcheck.md`): Monetization Integration tester, weight **0.25**

3. **Tester Play Protocols**:
   - **Player One**: Must complete at least 10 stages and experience at least 3 deaths/failures. Evaluates fun factor, difficulty balance, addiction potential, and polish. Logs emotional reactions throughout play.
   - **Bugcatcher**: Must spend at least 15 minutes testing with diverse inputs (rapid tapping, edge swipes, orientation changes, background/foreground switching, pause/resume). Records all console errors, performance metrics, and edge case behaviors.
   - **AdCheck**: Must reach at least 3 ad trigger points. Tests ad timing appropriateness, reward value fairness, and technical integration correctness.

4. **Bug Report Generation**: Each tester produces a structured test report following `docs/templates/test-report-template.json`, including:
   - Play timeline and emotion log
   - Screenshots of issues
   - Console error captures
   - Detailed bug reports with severity, category, reproduction steps, and suggested fixes
   - Subcriteria scores and qualitative assessment

5. **Save Bug Reports**: Write to `data/pipeline-runs/run-XXX/bug-reports/{slug}-{tester}.json`.

6. **Scoring and Gate Decision**:
   - **70+ points**: SHIP -- game proceeds to Phase 7 (Deployment)
   - **50-69 points** or any **blocker/major severity bugs**: REVISE -- bug reports are compiled and sent to the Developer agent for fixes. After fixes, all 3 testers re-test. Maximum of **2 fix rounds**.
   - **Below 50 points**: SCRAP -- game is permanently discarded

7. **Slack Notification**: "게임 '{title}' XX점 -> SHIP/REVISE/SCRAP" (Game '{title}' scored XX -> SHIP/REVISE/SCRAP)

### Data Files Created

| File | Location | Description |
|------|----------|-------------|
| Test reports | `data/pipeline-runs/run-XXX/bug-reports/{slug}-{tester}.json` | One report per tester per game |

---

## Phase 7: Deployment

**Purpose**: Deploy all games that passed testing to GitHub Pages for public access.

### Steps

1. **Spawn Shipper**: Spawn the **Shipper** agent (`agents/deployers/shipper.md`) for each game that received a SHIP verdict.

2. **Deployment Process**:
   ```bash
   git add games/{slug}/
   git commit -m "Deploy: {title} - {slug}"
   git push origin main
   # gh-pages deployment (via GitHub Actions or manual gh-pages push)
   ```

3. **URL Generation**: The deployed game URL follows the pattern:
   ```
   https://{username}.github.io/{repo-name}/games/{slug}/
   ```

4. **Slack Notification**: "게임 '{title}' 배포 완료: {URL}" (Game '{title}' deployed: {URL})

### Data Files Created

| File | Location | Description |
|------|----------|-------------|
| Deployed game | `games/{slug}/` (on gh-pages branch) | Publicly accessible game |

---

## Phase 8: Wrap-up

**Purpose**: Conduct final review, update tracking databases, and clean up the pipeline run.

### Steps

1. **Meta Leader Final Review**: Director, Producer, and Critic conduct a comprehensive review of the entire pipeline run:
   - **Agent Performance Analysis**: Each meta leader independently evaluates every agent that participated. They assess quality of output, speed, accuracy, and areas for improvement.
   - **Consensus Discussion**: Meta leaders exchange reviews via `SendMessage` and reach consensus on any changes to agent prompts, scoring weights, or pipeline parameters.
   - **Prompt Modifications**: If agreed upon (per the consensus protocol), meta leaders may modify files in `agents/` to improve future runs.
   - **Performance Data**: Update `data/agent-performance.json` with per-agent metrics from this run.

2. **Update Ideas Database**: Merge all newly generated and evaluated ideas into the master `data/ideas-database.json`, including:
   - All ideas generated (with pass/fail status)
   - Final scores and evaluation summaries
   - Deployment status for implemented games

3. **Generate Run Summary**: Create `data/pipeline-runs/run-XXX/run-summary.md` containing:
   - Total ideas generated, passed, and failed
   - Total plans approved, revised, and scrapped
   - Total games developed, shipped, and scrapped
   - Per-game scores and deployment URLs
   - Meta leader observations and recommended changes
   - Pipeline duration and performance metrics

4. **Shutdown Agents**: Send `SendMessage(type: "shutdown_request")` to all active team members.

5. **Delete Team**: Call `TeamDelete` to clean up the agent team instance.

6. **Final Slack Notification**: "전체 결과: N개 요청 -> X개 배포, Y개 폐기" (Final results: N requested -> X deployed, Y scrapped)

### Data Files Created/Updated

| File | Location | Description |
|------|----------|-------------|
| Agent performance | `data/agent-performance.json` | Cumulative agent metrics across runs |
| Ideas database | `data/ideas-database.json` | Master database of all ideas ever generated |
| Run summary | `data/pipeline-runs/run-XXX/run-summary.md` | Human-readable summary of the run |
| Meta leader reviews | `data/pipeline-runs/run-XXX/meta-leader-reviews/` | Individual and consensus reviews |

---

## Complete Data File Map

### Persistent Files (Survive Across Runs)

| File | Description |
|------|-------------|
| `data/ideas-database.json` | Master database of all ideas with status tracking |
| `data/agent-performance.json` | Cumulative performance metrics for all agents |

### Per-Run Files

| File | Description |
|------|-------------|
| `data/pipeline-runs/run-XXX/ideas-raw.json` | Raw generated ideas |
| `data/pipeline-runs/run-XXX/ideas-evaluated.json` | All idea evaluations |
| `data/pipeline-runs/run-XXX/ideas-passed.json` | Ideas that passed validation |
| `data/pipeline-runs/run-XXX/plans/{slug}-plan.md` | Game design documents |
| `data/pipeline-runs/run-XXX/plan-evaluations/{slug}-evaluation.json` | Plan evaluation results |
| `data/pipeline-runs/run-XXX/bug-reports/{slug}-{tester}.json` | Test reports per game per tester |
| `data/pipeline-runs/run-XXX/meta-leader-reviews/` | Meta leader review documents |
| `data/pipeline-runs/run-XXX/run-summary.md` | Overall run summary |

### Game Output

| File | Description |
|------|-------------|
| `games/{slug}/index.html` | Game entry point |
| `games/{slug}/css/style.css` | Game styles |
| `games/{slug}/js/*.js` | Game modules (config, main, game, stages, ui, ads) |

---

## Slack Notification Summary

| Phase | Notification |
|-------|-------------|
| Phase 0 | "게임 N개 제작 파이프라인 시작" |
| Phase 1 | "아이디어 M개 생성 완료, 검증 시작" |
| Phase 2 | "K개 아이디어 통과, 기획 시작" |
| Phase 4 | "J개 기획 통과, 개발 시작" |
| Phase 5 | "게임 '{title}' 개발 완료, 테스트 시작" (per game) |
| Phase 6 | "게임 '{title}' XX점 -> SHIP/REVISE/SCRAP" (per game) |
| Phase 7 | "게임 '{title}' 배포 완료: {URL}" (per game) |
| Phase 8 | "전체 결과: N개 요청 -> X개 배포, Y개 폐기" |

Additional notifications are sent for meta leader consensus decisions at review checkpoints.

---

## Agent Roster Summary

| Category | Agent | Prompt File | Role |
|----------|-------|-------------|------|
| Meta Leaders | Director | `agents/meta-leaders/director.md` | Creative vision, quality oversight |
| Meta Leaders | Producer | `agents/meta-leaders/producer.md` | Schedule, efficiency, bottleneck detection |
| Meta Leaders | Critic | `agents/meta-leaders/critic.md` | Weakness analysis, improvement suggestions |
| Ideators | Spark | `agents/ideators/spark.md` | Proven mechanics with creative twists |
| Ideators | Oddball | `agents/ideators/oddball.md` | Experimental and unconventional ideas |
| Ideators | Trendsetter | `agents/ideators/trendsetter.md` | Trend-aligned and viral-potential ideas |
| Idea Judges | Professor Ludus | `agents/idea-judges/professor-ludus.md` | Game design evaluation (0.35) |
| Idea Judges | Dr. Loop | `agents/idea-judges/dr-loop.md` | Player psychology evaluation (0.25) |
| Idea Judges | Cash | `agents/idea-judges/cash.md` | Monetization evaluation (0.20) |
| Idea Judges | Scout | `agents/idea-judges/scout.md` | Market viability evaluation (0.20) |
| Planners | Architect | `agents/planners/architect.md` | Detailed game design document creation |
| Plan Judges | Builder | `agents/plan-judges/builder.md` | Technical feasibility evaluation (0.40) |
| Plan Judges | Joy | `agents/plan-judges/joy.md` | Fun/engagement evaluation (0.35) |
| Plan Judges | Profit | `agents/plan-judges/profit.md` | Business viability evaluation (0.25) |
| Developers | Developer | `agents/developers/developer.md` | Game implementation |
| Testers | Player One | `agents/testers/player-one.md` | Player experience testing (0.35) |
| Testers | Bugcatcher | `agents/testers/bugcatcher.md` | QA testing (0.40) |
| Testers | AdCheck | `agents/testers/adcheck.md` | Monetization integration testing (0.25) |
| Deployers | Shipper | `agents/deployers/shipper.md` | gh-pages deployment |

---

## Pipeline Flow Diagram

```
Phase 0: Initialization
    │
    ├─ TeamCreate("game-pipeline-YYYYMMDD-NNN")
    ├─ Slack: "파이프라인 시작"
    └─ Spawn: Director, Producer, Critic
         │
Phase 1: Idea Generation (Parallel)
    │
    ├─ Load ideas-database.json
    ├─ Spawn: Spark, Oddball, Trendsetter (parallel)
    ├─ Duplicate detection against existing DB
    ├─ Save: ideas-raw.json
    ├─ Slack: "아이디어 M개 생성 완료"
    └─ Meta Leader Review
         │
Phase 2: Idea Validation (Per Idea, 4 Judges Parallel)
    │
    ├─ Spawn per idea: Professor Ludus, Dr. Loop, Cash, Scout
    ├─ Weighted scoring → 70+ = PASS, <70 = FAIL
    ├─ If shortfall: loop back to Phase 1 for deficit
    ├─ Save: ideas-evaluated.json, ideas-passed.json
    └─ Slack: "K개 아이디어 통과"
         │
Phase 3: Planning (Per Passed Idea)
    │
    ├─ Spawn: Architect per idea
    ├─ Create game design doc from template
    └─ Save: plans/{slug}-plan.md
         │
Phase 4: Plan Validation (Per Plan, 3 Judges Parallel)
    │
    ├─ Spawn per plan: Builder, Joy, Profit
    ├─ 70+ = PASS, 50-69 = REVISE (max 2x), <50 = SCRAP
    ├─ Save: plan-evaluations/{slug}-evaluation.json
    ├─ Slack: "J개 기획 통과"
    └─ Meta Leader Review (Phase 2-4)
         │
Phase 5: Development (Per Passed Plan)
    │
    ├─ Spawn: Developer per game
    ├─ Implement in games/{slug}/
    └─ Slack: "게임 '{title}' 개발 완료"
         │
Phase 6: Testing + Bug Fix Loop (Per Game)
    │
    ├─ Start: npx http-server games/{slug} -p 8080
    ├─ Spawn: Player One, Bugcatcher, AdCheck (parallel)
    ├─ Playwright-driven automated play testing
    ├─ 70+ = SHIP, 50-69 or blocker/major = REVISE (max 2x), <50 = SCRAP
    ├─ Save: bug-reports/{slug}-{tester}.json
    └─ Slack: "게임 '{title}' XX점 → SHIP/REVISE/SCRAP"
         │
Phase 7: Deployment (SHIP Only)
    │
    ├─ Spawn: Shipper per game
    ├─ git add → commit → gh-pages deploy
    └─ Slack: "게임 '{title}' 배포 완료: {URL}"
         │
Phase 8: Wrap-up
    │
    ├─ Meta Leader Final Review
    ├─ Update: agent-performance.json
    ├─ Update: ideas-database.json
    ├─ Generate: run-summary.md
    ├─ SendMessage(type: "shutdown_request") to all agents
    ├─ TeamDelete
    └─ Slack: "전체 결과: N개 요청 → X개 배포, Y개 폐기"
```
