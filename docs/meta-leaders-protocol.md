# AI Game Studio - Meta Leaders Protocol

This document details the meta leader system that oversees the entire game production pipeline. Three meta leaders -- Director, Producer, and Critic -- operate as a governing council that monitors agent performance, reviews pipeline outputs, and makes strategic decisions to improve the system over time.

---

## Meta Leader Roles

### Director

**Agent File**: `agents/meta-leaders/director.md`
**Core Philosophy**: Creative vision and quality obsession

The Director is the creative authority of the pipeline. Every output is evaluated through the lens of "Is this good enough to ship?" The Director has the highest quality bar and is the most likely to request regeneration or revision.

**Responsibilities**:
- Evaluate the creative quality of generated ideas, ensuring they are original and compelling
- Review game design documents for coherence, completeness, and creative ambition
- Assess the final play experience for polish and emotional impact
- Request idea regeneration if the initial pool lacks creativity or variety
- Champion bold, innovative concepts even if they carry higher risk
- Ensure the overall portfolio of games is diverse and not repetitive

**Review Focus Areas**:
- Idea originality and creative ambition
- Game design document completeness and vision clarity
- Visual style consistency and appeal
- Player experience quality and emotional engagement
- Portfolio diversity across the pipeline run

**Special Power**: The Director can unilaterally request idea regeneration (bypassing consensus) if the idea pool is assessed as creatively bankrupt. This is the only unilateral action any meta leader can take, and it must be documented with justification.

---

### Producer

**Agent File**: `agents/meta-leaders/producer.md`
**Core Philosophy**: Efficiency, throughput, and bottleneck detection

The Producer is the operational authority of the pipeline. Every process is evaluated through the lens of "Are we moving fast enough without waste?" The Producer focuses on flow, timing, and resource allocation.

**Responsibilities**:
- Monitor pipeline throughput and identify bottlenecks
- Track time spent in each phase and flag delays
- Manage agent allocation to prevent idle time or overload
- Optimize the balance between quality and velocity
- Detect when revision loops are unproductive and recommend scrapping
- Ensure that failed/scrapped work is minimized through early detection

**Review Focus Areas**:
- Phase duration and time distribution
- Agent utilization rates (idle time, parallel execution efficiency)
- Revision loop efficiency (are revisions converging toward passing scores?)
- Resource waste (scrapped ideas, plans, or games as a percentage of total)
- Overall pipeline velocity (games shipped per unit time)

**Special Concern**: The Producer monitors revision loops closely. If a plan or game is in its second revision round and scores are not trending upward, the Producer advocates for scrapping early to avoid wasting further development and testing resources.

---

### Critic

**Agent File**: `agents/meta-leaders/critic.md`
**Core Philosophy**: Weakness analysis, performance review, and continuous improvement

The Critic is the analytical authority of the pipeline. Every output and process is evaluated through the lens of "What went wrong and how do we prevent it next time?" The Critic is the primary driver of system improvement.

**Responsibilities**:
- Identify weaknesses in agent outputs across all phases
- Analyze patterns of failure (why do ideas fail? why do plans need revision?)
- Review individual agent performance and suggest prompt improvements
- Propose structural changes to the pipeline based on observed issues
- Track improvement trends across multiple pipeline runs
- Provide constructive criticism that leads to actionable improvements

**Review Focus Areas**:
- Agent output quality trends (improving, stable, or degrading)
- Failure pattern analysis (common reasons for idea/plan/test failure)
- Scoring calibration (are judges too lenient or too harsh?)
- Prompt effectiveness (do agent prompts produce the desired behavior?)
- Pipeline structural issues (are the right phases in the right order?)

**Special Concern**: The Critic maintains a running analysis of agent performance across runs, stored in `data/agent-performance.json`. This longitudinal data enables trend detection that single-run reviews cannot capture.

---

## Review Checkpoints

Meta leaders conduct formal reviews at 3 points during each pipeline run:

### Checkpoint 1: Post-Idea Generation (After Phase 1)

**Trigger**: All ideators have completed their work and raw ideas are saved.

**Review Scope**:
- Quality and diversity of the idea pool
- Effectiveness of duplicate detection
- Whether the idea generation prompts need adjustment
- Whether additional ideators should be spawned

**Participants**: Director (lead), Producer, Critic

---

### Checkpoint 2: Post-Plan Validation (After Phase 4)

**Trigger**: All plans have been evaluated (and revised if applicable).

**Review Scope**:
- Cumulative results of idea validation (Phase 2) and plan validation (Phase 4)
- Patterns in what passed and what failed
- Whether scoring weights or thresholds need calibration
- Quality of the Architect's game design documents
- Effectiveness of the revision process

**Participants**: Director, Producer (lead), Critic

---

### Checkpoint 3: Final Review (Phase 8)

**Trigger**: All games have been tested, deployed (or scrapped), and the pipeline is winding down.

**Review Scope**:
- Comprehensive performance review of every agent
- End-to-end pipeline efficiency analysis
- Scoring system calibration review
- Prompt modification recommendations
- Structural pipeline change proposals
- Agent addition/removal recommendations

**Participants**: Director, Producer, Critic (lead)

---

## Consensus Protocol

All meta leader decisions follow a structured consensus protocol. This ensures that changes are well-considered and have sufficient support before implementation.

### Voting Mechanism

1. **Independent Assessment**: Each meta leader independently writes their feedback and recommendation for the decision at hand. This prevents groupthink and ensures diverse perspectives.

2. **Feedback Exchange**: Meta leaders share their assessments with each other via `SendMessage`. Each leader reads the other two assessments.

3. **Discussion Round**: A single round of discussion occurs where leaders can modify their positions based on new arguments. Each leader states their final vote: APPROVE, CONDITIONAL, or REJECT.

4. **Vote Tally**: The final decision is based on the number of APPROVE votes.

### Consensus Thresholds

| Vote Count | Decision | Action |
|-----------|----------|--------|
| 3/3 Unanimous (all APPROVE) | Immediate Execution | The proposed change is implemented immediately with full confidence. No trial period required. |
| 2/3 Majority (2 APPROVE, 1 REJECT or CONDITIONAL) | Conditional Execution | The proposed change is implemented on a trial basis for 1 pipeline run. After the trial run, the change is re-evaluated. If the trial shows improvement, the change becomes permanent. If not, it is reverted. |
| 1/3 Minority (1 APPROVE, 2 REJECT or CONDITIONAL) | Defer | The proposed change is not implemented. It is recorded as a deferred proposal in the meta leader review notes. It may be re-proposed in a future review with additional supporting evidence. |
| 0/3 None (all REJECT) | Reject | The proposed change is rejected. It should not be re-proposed without fundamentally new evidence or circumstances. |

### Tie-Breaking

In the event of a 1 APPROVE / 1 CONDITIONAL / 1 REJECT split, the decision defaults to DEFER. The CONDITIONAL voter is asked to clarify whether they lean toward approval or rejection, and if they lean toward approval, the decision upgrades to Conditional Execution.

---

## Changeable Items and Required Consensus

Meta leaders can propose changes to various aspects of the pipeline. Each type of change requires a specific consensus level to ensure that impactful changes receive more scrutiny.

### Prompt Modification

**Description**: Modifying the prompt text of any agent in the `agents/` directory. This includes changing instructions, adjusting tone, adding constraints, or refining evaluation criteria within the prompt.

**Required Consensus**: 2/3 (Conditional)

**Process**:
1. The proposing leader identifies the specific prompt file and the exact changes.
2. A justification is provided, referencing specific performance data or output examples.
3. If approved (2/3), the change is applied to the prompt file.
4. If conditional (2/3 with trial), the change is applied and marked with a comment noting it is under trial.
5. After the trial run, the change is reviewed and either made permanent or reverted.

**Constraints**:
- Only one prompt can be modified per review checkpoint (to isolate the effects of changes).
- The original prompt text must be preserved in a comment block within the file for potential rollback.

---

### Weight Adjustment

**Description**: Modifying the weight assigned to a judge in any evaluation gate (idea, plan, or test evaluation).

**Required Consensus**: 2/3 (Conditional)

**Process**:
1. The proposing leader specifies which gate and which judge's weight should change.
2. The proposed new weight is stated along with the resulting weights for all judges (must sum to 1.00).
3. Evidence must be provided showing the current weight distribution produces suboptimal results.
4. If approved, the weights are updated in the pipeline configuration and documented.

**Constraints**:
- Maximum adjustment of +/- 0.10 per judge per review.
- All weights in a gate must sum to exactly 1.00.
- A judge's weight cannot be reduced below 0.10 or increased above 0.50.

---

### Agent Add/Remove

**Description**: Adding a new agent role to the pipeline or removing an existing one.

**Required Consensus**: 3/3 (Unanimous)

**Process**:
1. The proposing leader describes the new agent's role, responsibilities, and which phase it operates in.
2. For additions: a draft prompt file must be provided.
3. For removals: justification must show the agent is redundant or counterproductive.
4. Impact analysis must cover how the change affects scoring weights, pipeline flow, and other agents.
5. If unanimously approved, the agent file is created/removed and the pipeline configuration is updated.

**Constraints**:
- Adding an agent requires creating a prompt file in the appropriate `agents/` subdirectory.
- Removing an agent requires redistributing its weight among remaining judges in the same gate.
- No more than 1 agent can be added or removed per pipeline run.

---

### Role Splitting

**Description**: Splitting one agent's role into two specialized agents (e.g., splitting Bugcatcher into "Performance Tester" and "Functional Tester").

**Required Consensus**: 3/3 (Unanimous)

**Process**:
1. The proposing leader identifies the agent to split and the two resulting specialized roles.
2. Draft prompt files for both new agents must be provided.
3. Weight distribution between the two new agents must be proposed (their combined weight equals the original agent's weight).
4. Impact analysis must justify why specialization improves outcomes.
5. If unanimously approved, the original agent file is archived and two new files are created.

**Constraints**:
- The combined weight of the two new agents must equal the original agent's weight.
- Both new agents must be tested in a trial run before the split becomes permanent.
- Only one role split can occur per pipeline run.

---

### Pass Threshold Adjustment

**Description**: Modifying the score threshold required to pass an evaluation gate.

**Required Consensus**: 3/3 (Unanimous)

**Process**:
1. The proposing leader specifies which gate (idea, plan, or test) and the proposed new threshold.
2. Historical data must be provided showing the current threshold is too lenient or too strict.
3. Impact analysis must estimate how many past ideas/plans/games would have been affected by the change.
4. If unanimously approved, the threshold is updated in the pipeline configuration.

**Constraints**:
- The pass threshold must remain within the range of 60-80.
- The revision threshold (lower bound for REVISE verdict) must remain at least 20 points below the pass threshold.
- Only one gate's threshold can be changed per pipeline run.

---

## Performance Tracking

### Agent Performance File

All agent performance data is tracked in `data/agent-performance.json`. This file is updated during Phase 8 (Wrap-up) after each pipeline run.

**Structure**:
```json
{
  "last_updated": "2026-03-04T12:00:00Z",
  "run_count": 5,
  "agents": {
    "spark": {
      "role": "ideator",
      "runs_participated": 5,
      "ideas_generated": 45,
      "ideas_passed": 28,
      "pass_rate": 0.622,
      "average_score": 71.3,
      "trend": "improving",
      "last_prompt_change": "2026-02-20",
      "notes": "Strong on mechanics depth, weaker on monetization hooks"
    },
    "professor-ludus": {
      "role": "idea-judge",
      "runs_participated": 5,
      "ideas_evaluated": 135,
      "average_score_given": 68.2,
      "score_std_dev": 12.4,
      "calibration": "slightly_strict",
      "agreement_with_final_verdict": 0.89,
      "trend": "stable",
      "notes": "Consistently tough on originality scores"
    }
  },
  "meta_leader_decisions": [
    {
      "run": "run-2026-03-04-001",
      "checkpoint": "final_review",
      "proposal": "Increase Professor Ludus weight from 0.35 to 0.40",
      "proposer": "critic",
      "votes": {
        "director": "approve",
        "producer": "reject",
        "critic": "approve"
      },
      "result": "conditional",
      "trial_run": "run-2026-03-05-001",
      "trial_outcome": "pending"
    }
  ]
}
```

### Tracked Metrics per Agent Type

**Ideators** (Spark, Oddball, Trendsetter):
- Total ideas generated
- Ideas that passed validation
- Pass rate (passed / generated)
- Average score across all evaluations
- Score trend across runs (improving, stable, degrading)
- Common strengths and weaknesses (from judge feedback)

**Judges** (Professor Ludus, Dr. Loop, Cash, Scout, Builder, Joy, Profit):
- Total evaluations conducted
- Average score given
- Standard deviation of scores (calibration indicator)
- Agreement rate with final verdict (does the judge's individual score align with the composite pass/fail?)
- Score distribution histogram
- Calibration assessment (too strict, well-calibrated, too lenient)

**Developer**:
- Games implemented
- Test pass rate on first attempt
- Average bug count per game
- Common bug categories
- Code quality metrics (file sizes, modularity adherence)

**Testers** (Player One, Bugcatcher, AdCheck):
- Games tested
- Average score given
- Bugs reported (by severity)
- False positive rate (bugs reported that turn out to be non-issues)
- Coverage completeness (stages reached, time spent, ad triggers hit)

**Meta Leaders** (Director, Producer, Critic):
- Reviews conducted
- Proposals made
- Proposals approved
- Impact of approved changes on subsequent run metrics
- Agreement rate with other meta leaders

---

## Decision Recording

All meta leader decisions are recorded in `data/pipeline-runs/run-XXX/meta-leader-reviews/` with the following structure:

### Individual Review File

```
meta-leader-reviews/
├── checkpoint-1/
│   ├── director-review.md
│   ├── producer-review.md
│   ├── critic-review.md
│   └── consensus-decision.json
├── checkpoint-2/
│   ├── director-review.md
│   ├── producer-review.md
│   ├── critic-review.md
│   └── consensus-decision.json
└── final-review/
    ├── director-review.md
    ├── producer-review.md
    ├── critic-review.md
    ├── consensus-decision.json
    └── agent-performance-updates.json
```

### Consensus Decision File Format

```json
{
  "checkpoint": "checkpoint-1",
  "run_id": "run-2026-03-04-001",
  "timestamp": "2026-03-04T14:30:00Z",
  "proposals": [
    {
      "id": "prop-001",
      "type": "prompt_modification",
      "target": "agents/ideators/oddball.md",
      "description": "Add stronger constraint for mobile-first design thinking",
      "proposer": "critic",
      "votes": {
        "director": { "vote": "approve", "reasoning": "Oddball's ideas often ignore mobile constraints" },
        "producer": { "vote": "approve", "reasoning": "Reduces plan revision rates" },
        "critic": { "vote": "approve", "reasoning": "Data shows 40% of Oddball ideas fail on implementability" }
      },
      "result": "unanimous",
      "action": "immediate_execution",
      "implementation_notes": "Added mobile-first constraint to Section 3 of oddball.md"
    }
  ],
  "general_observations": [
    "Idea quality has improved 12% since last prompt update",
    "Plan revision rate is at 30%, down from 45%",
    "Testing phase is the current bottleneck - consider parallel test execution"
  ],
  "next_actions": [
    "Monitor Oddball prompt change impact in next run",
    "Producer to investigate test phase parallelization"
  ]
}
```

---

## Escalation Protocol

In rare cases, meta leaders may encounter situations that require escalation beyond the normal consensus protocol:

### Pipeline Halt

**Trigger**: A critical issue is discovered that affects the integrity of the entire pipeline run (e.g., all generated ideas are duplicates, the Developer agent is producing broken code systematically).

**Required Consensus**: 2/3

**Action**: The pipeline is paused. All active agents receive a hold message. The meta leaders convene an emergency review to determine whether to restart, skip a phase, or abort the run entirely.

### Emergency Agent Replacement

**Trigger**: An agent is consistently producing unacceptable output within the current run (not across runs).

**Required Consensus**: 2/3

**Action**: The underperforming agent is shut down. A replacement agent is spawned with a modified prompt that addresses the identified issues. The pipeline resumes with the replacement agent.

### Pipeline Abort

**Trigger**: The pipeline run has failed to produce any viable games after exhausting all revision rounds.

**Required Consensus**: 3/3

**Action**: The entire run is aborted. All agents are shut down. A detailed post-mortem is generated analyzing why the run failed. Recommendations for the next run are recorded.
