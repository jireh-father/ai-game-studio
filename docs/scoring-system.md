# AI Game Studio - Scoring System

This document details the weighted scoring system used across all three evaluation gates in the pipeline: Idea Evaluation, Plan Evaluation, and Test Evaluation. Each gate uses domain-specific judges with calibrated weights to produce a composite score that determines whether a game concept advances to the next phase.

---

## Scoring Methodology

### General Principles

1. **Subcriteria Scoring**: Each judge evaluates multiple subcriteria on a 1-10 scale.
   - 1-2: Fundamentally flawed, unacceptable
   - 3-4: Below average, significant concerns
   - 5-6: Average, meets minimum expectations
   - 7-8: Good, above average with clear strengths
   - 9-10: Exceptional, outstanding quality

2. **Category Score Calculation**: Each judge's subcriteria scores are averaged and then scaled to a 0-100 range.
   ```
   category_score = (sum of subcriteria scores / number of subcriteria) * 10
   ```
   For example, if a judge has 4 subcriteria scored [8, 7, 6, 9], the category score is:
   ```
   (8 + 7 + 6 + 9) / 4 * 10 = 7.5 * 10 = 75
   ```

3. **Weighted Composite Score**: The final score is the weighted sum of all judges' category scores.
   ```
   final_score = sum(judge_weight * judge_category_score) for all judges
   ```
   All judge weights within a gate sum to 1.00.

4. **Qualitative Feedback**: In addition to numerical scores, each judge provides:
   - Strengths: What works well
   - Concerns: What raises red flags
   - Suggestions: Specific improvements that would raise scores
   - Reasoning: Narrative explanation of the evaluation

---

## Gate 1: Idea Evaluation

**Phase**: Phase 2 (Idea Validation)
**Judges**: 4
**Pass Threshold**: 70/100
**Total Weight**: 1.00

### Professor Ludus -- Game Design (Weight: 0.35)

Professor Ludus is the game design authority, evaluating the fundamental quality and viability of the game concept from a design perspective. This judge carries the highest weight because strong game design is the foundation of a successful game.

| Subcriterion | Score Range | Description |
|-------------|-------------|-------------|
| Mechanics Depth | 1-10 | How deep and engaging are the core mechanics? Do they support meaningful player decisions and skill expression? A score of 1 indicates a trivial single-action mechanic with no depth. A score of 10 indicates a richly layered mechanic system with emergent complexity. |
| Infinite Stage Potential | 1-10 | How well does the game concept support infinite procedural stage generation? Can difficulty and variety scale indefinitely without feeling repetitive? A score of 1 means the concept has a hard ceiling with no natural extension. A score of 10 means the concept inherently supports unlimited, varied progression. |
| Originality | 1-10 | How novel is the concept compared to existing mobile games? Does it offer a genuinely fresh experience or merely clone existing games? A score of 1 indicates a direct clone of a popular game. A score of 10 indicates a concept that feels genuinely new and inventive. |
| Learning Curve | 1-10 | How appropriate is the learning curve for the target audience (casual mobile gamers)? Is it immediately intuitive yet deep enough to sustain interest? A score of 1 means players cannot understand the game without extensive tutorial. A score of 10 means the game is instantly intuitive with a natural skill ramp. |
| Accessibility | 1-10 | How accessible is the game across different player skill levels, physical abilities, and device capabilities? A score of 1 means the game excludes many players. A score of 10 means the game is broadly accessible with thoughtful accommodations. |

**Category Score Calculation**:
```
professor_ludus_score = ((mechanics_depth + infinite_stage_potential + originality + learning_curve + accessibility) / 5) * 10
```

**Contribution to Final Score**: `professor_ludus_score * 0.35`

---

### Dr. Loop -- Player Psychology (Weight: 0.25)

Dr. Loop evaluates the psychological engagement patterns of the game concept. This judge assesses whether the game will create compelling play sessions and long-term retention through proven psychological hooks.

| Subcriterion | Score Range | Description |
|-------------|-------------|-------------|
| Flow State | 1-10 | How effectively does the game concept support entering and maintaining a flow state? Does the challenge-skill balance stay in the optimal zone? A score of 1 means the game disrupts concentration constantly. A score of 10 means the game creates deep, absorbing focus. |
| Addiction Loop | 1-10 | How strong is the core gameplay loop at creating "just one more try" compulsion? Does the game naturally encourage repeated sessions? A score of 1 means players feel no urge to replay. A score of 10 means the game creates powerful, healthy re-engagement patterns. |
| Shareability | 1-10 | How naturally does the game create moments worth sharing (screenshots, scores, achievements)? Does it have built-in viral mechanics? A score of 1 means nothing notable happens worth sharing. A score of 10 means every session produces shareable moments. |
| Emotional Arc | 1-10 | How well does the game design create emotional highs and lows during a play session? Does it build tension, deliver satisfaction, and create memorable moments? A score of 1 means the emotional experience is flat. A score of 10 means the game delivers a rich emotional rollercoaster. |

**Category Score Calculation**:
```
dr_loop_score = ((flow_state + addiction_loop + shareability + emotional_arc) / 4) * 10
```

**Contribution to Final Score**: `dr_loop_score * 0.25`

---

### Cash -- Monetization (Weight: 0.20)

Cash evaluates the revenue potential and monetization compatibility of the game concept. This judge assesses how well the game can generate income through ads and in-app purchases without degrading the player experience.

| Subcriterion | Score Range | Description |
|-------------|-------------|-------------|
| Ad Suitability | 1-10 | How naturally do ad placements fit into the game flow? Are there clear pause points where interstitial or rewarded ads feel appropriate rather than intrusive? A score of 1 means ads would severely disrupt gameplay. A score of 10 means the game has perfect natural ad break points. |
| Session Length | 1-10 | How well does the expected session length support monetization? Sessions too short reduce ad impressions; too long reduces frequency. Ideal is 3-8 minutes per session. A score of 1 means sessions are inappropriately timed for monetization. A score of 10 means session length is perfectly optimized. |
| Retention Potential | 1-10 | How likely is the concept to bring players back for multiple sessions over days and weeks? Higher retention means more lifetime ad impressions and purchase opportunities. A score of 1 means players will likely abandon after one session. A score of 10 means the concept has strong multi-week retention hooks. |
| IAP Opportunity | 1-10 | How naturally does the game concept support in-app purchase opportunities (cosmetics, power-ups, skip mechanics) without being pay-to-win? A score of 1 means no natural purchase opportunities exist. A score of 10 means the game has clear, desirable purchase options. |

**Category Score Calculation**:
```
cash_score = ((ad_suitability + session_length + retention_potential + iap_opportunity) / 4) * 10
```

**Contribution to Final Score**: `cash_score * 0.20`

---

### Scout -- Market Viability (Weight: 0.20)

Scout evaluates the market positioning and competitive landscape for the game concept. This judge assesses whether the game can find an audience and stand out in the crowded mobile gaming market.

| Subcriterion | Score Range | Description |
|-------------|-------------|-------------|
| Market Gap | 1-10 | Does the concept fill an underserved niche or unmet player need? Is there room in the market for this type of game? A score of 1 means the market is completely saturated with identical games. A score of 10 means there is a clear unserved demand this game addresses. |
| Viral Potential | 1-10 | How likely is the game to spread through word-of-mouth, social sharing, or organic discovery? Does it have inherent virality? A score of 1 means the game has zero viral hooks. A score of 10 means the game has powerful built-in viral mechanics and shareability. |
| Competitive Edge | 1-10 | What distinct advantage does this game have over existing competitors? Is there a defensible differentiator? A score of 1 means there is no distinguishing factor. A score of 10 means the game has a clear, compelling unique selling point. |
| Trend Alignment | 1-10 | How well does the concept align with current gaming trends, cultural moments, or emerging player preferences? A score of 1 means the concept is counter to all current trends. A score of 10 means the concept perfectly rides a growing trend wave. |

**Category Score Calculation**:
```
scout_score = ((market_gap + viral_potential + competitive_edge + trend_alignment) / 4) * 10
```

**Contribution to Final Score**: `scout_score * 0.20`

---

### Idea Final Score Calculation

```
idea_final_score = (professor_ludus_score * 0.35) + (dr_loop_score * 0.25) + (cash_score * 0.20) + (scout_score * 0.20)
```

**Example**:
```
Professor Ludus subcriteria: [8, 7, 6, 8, 7] → category = (36/5)*10 = 72
Dr. Loop subcriteria:        [7, 8, 6, 7]    → category = (28/4)*10 = 70
Cash subcriteria:             [6, 7, 8, 5]    → category = (26/4)*10 = 65
Scout subcriteria:            [7, 6, 7, 8]    → category = (28/4)*10 = 70

final_score = (72 * 0.35) + (70 * 0.25) + (65 * 0.20) + (70 * 0.20)
            = 25.2 + 17.5 + 13.0 + 14.0
            = 69.7 → FAIL (below 70)
```

### Idea Gate Decision

| Score Range | Verdict | Action |
|------------|---------|--------|
| 70-100 | PASS | Idea proceeds to Phase 3 (Planning) |
| 0-69 | FAIL | Idea is discarded; if total passed ideas < N, trigger supplementary generation in Phase 1 |

---

## Gate 2: Plan Evaluation

**Phase**: Phase 4 (Plan Validation)
**Judges**: 3
**Pass Threshold**: 70/100
**Revision Range**: 50-69
**Total Weight**: 1.00

### Builder -- Technical Feasibility (Weight: 0.40)

Builder is the technical authority, evaluating whether the game design document can realistically be implemented within the project's technical constraints. This judge carries the highest weight because an unimplementable plan wastes all downstream effort.

| Subcriterion | Score Range | Description |
|-------------|-------------|-------------|
| Implementability | 1-10 | Can the described game be implemented with the specified tech stack (Phaser 3/PixiJS/Canvas, SVG graphics, no external assets)? Are all described features realistically buildable within the constraint of 300 lines per JS file? A score of 1 means the plan describes features impossible with the tech stack. A score of 10 means every feature is clearly implementable. |
| Performance | 1-10 | Will the game run smoothly on target mobile devices (360-428px width)? Are there any described features that would cause frame drops, excessive memory usage, or battery drain? A score of 1 means severe performance issues are inevitable. A score of 10 means the design is optimized for mobile performance. |
| Modularity | 1-10 | How well does the plan decompose into the required modular file structure (config, main, game, stages, ui, ads)? Are responsibilities clearly separated? A score of 1 means the design has no clear modular boundaries. A score of 10 means each module has a crystal-clear, well-bounded responsibility. |
| Maintainability | 1-10 | How easy would the resulting code be to understand, debug, and modify during the bug fix loop? Is the architecture clean and predictable? A score of 1 means the design would produce unmaintainable spaghetti code. A score of 10 means the design leads to clean, debuggable code. |

**Category Score Calculation**:
```
builder_score = ((implementability + performance + modularity + maintainability) / 4) * 10
```

**Contribution to Final Score**: `builder_score * 0.40`

---

### Joy -- Fun/Engagement (Weight: 0.35)

Joy evaluates whether the planned game will actually be fun and engaging to play. This judge bridges the gap between abstract game design and concrete player experience, assessing the plan's detailed mechanics from a pure enjoyment perspective.

| Subcriterion | Score Range | Description |
|-------------|-------------|-------------|
| First Impression | 1-10 | Will the game make a strong positive impression in the first 10 seconds? Is the visual style appealing, the first interaction satisfying, and the concept immediately clear? A score of 1 means players will close the game immediately. A score of 10 means the first moments are captivating. |
| Core Loop | 1-10 | Is the planned core gameplay loop described in enough detail, and does it sound genuinely fun to repeat? Does the loop have satisfying feedback (visual, audio, haptic)? A score of 1 means the core loop sounds tedious. A score of 10 means the core loop sounds deeply satisfying and endlessly repeatable. |
| Replayability | 1-10 | Does the plan include sufficient variation, randomness, and progression to keep the game interesting across many sessions? A score of 1 means the game would feel identical every time. A score of 10 means each session feels fresh and different. |
| Difficulty Curve | 1-10 | Is the planned difficulty progression well-calibrated? Does it start easy enough for beginners while ramping to challenge experienced players? A score of 1 means the difficulty is either punishing or trivially easy. A score of 10 means the difficulty curve is perfectly tuned. |

**Category Score Calculation**:
```
joy_score = ((first_impression + core_loop + replayability + difficulty_curve) / 4) * 10
```

**Contribution to Final Score**: `joy_score * 0.35`

---

### Profit -- Business Viability (Weight: 0.25)

Profit evaluates the plan's detailed monetization strategy and business potential. This judge focuses on whether the plan translates the game concept's revenue potential into a concrete, implementable monetization design.

| Subcriterion | Score Range | Description |
|-------------|-------------|-------------|
| Ad Integration | 1-10 | How well does the plan specify concrete ad placement points (interstitial timing, rewarded ad triggers, banner positions)? Are the placements well-justified and non-intrusive? A score of 1 means ad integration is vague or player-hostile. A score of 10 means ad placements are precisely specified and player-friendly. |
| Session Economy | 1-10 | Does the plan describe a coherent session economy (lives, energy, currency, rewards) that naturally drives both engagement and monetization? A score of 1 means there is no session economy or it conflicts with fun. A score of 10 means the session economy perfectly balances engagement and revenue. |
| Launch Readiness | 1-10 | Is the monetization plan complete enough to ship without additional business design work? Are all revenue touchpoints clearly specified? A score of 1 means significant monetization design work remains. A score of 10 means the monetization design is ship-ready. |

**Category Score Calculation**:
```
profit_score = ((ad_integration + session_economy + launch_readiness) / 3) * 10
```

**Contribution to Final Score**: `profit_score * 0.25`

---

### Plan Final Score Calculation

```
plan_final_score = (builder_score * 0.40) + (joy_score * 0.35) + (profit_score * 0.25)
```

**Example**:
```
Builder subcriteria:  [7, 8, 7, 6] → category = (28/4)*10 = 70
Joy subcriteria:      [8, 9, 7, 8] → category = (32/4)*10 = 80
Profit subcriteria:   [6, 5, 7]    → category = (18/3)*10 = 60

plan_final_score = (70 * 0.40) + (80 * 0.35) + (60 * 0.25)
                 = 28.0 + 28.0 + 15.0
                 = 71.0 → PASS
```

### Plan Gate Decision

| Score Range | Verdict | Action |
|------------|---------|--------|
| 70-100 | PASS | Plan proceeds to Phase 5 (Development) |
| 50-69 | REVISE | Feedback compiled and sent to Architect for revision. Re-evaluate after revision. Maximum 2 revision rounds. If still below 70 after 2 revisions, the plan is scrapped. |
| 0-49 | SCRAP | Plan is permanently discarded. A backup idea (if available) replaces it. |

---

## Gate 3: Test Evaluation

**Phase**: Phase 6 (Testing + Bug Fix Loop)
**Testers**: 3
**Pass Threshold**: 70/100
**Fix Range**: 50-69 (or blocker/major bugs present)
**Total Weight**: 1.00

### Player One -- Player Experience (Weight: 0.35)

Player One evaluates the game from a real player's perspective, focusing on subjective enjoyment, feel, and polish. This tester plays through at least 10 stages and experiences at least 3 deaths to assess the full range of the player experience.

| Subcriterion | Score Range | Description |
|-------------|-------------|-------------|
| Fun Factor | 1-10 | How fun is the game to actually play? Does it deliver on the promise of its concept? Is the moment-to-moment gameplay enjoyable? A score of 1 means the game is not fun at all. A score of 10 means the game is immediately and consistently delightful. |
| Difficulty Balance | 1-10 | Is the implemented difficulty curve well-calibrated? Does it feel fair? Are deaths the player's fault rather than cheap hits? A score of 1 means the difficulty is broken (unfair or trivial). A score of 10 means every challenge feels fair and well-paced. |
| Addiction | 1-10 | Does the game create a "just one more try" feeling? After dying, does the player immediately want to restart? A score of 1 means the player feels no desire to replay. A score of 10 means the game is compulsively replayable. |
| Polish | 1-10 | Does the game feel polished and complete? Are transitions smooth, feedback immediate, and visual quality consistent? A score of 1 means the game feels like a broken prototype. A score of 10 means the game feels professionally polished. |

**Category Score Calculation**:
```
player_one_score = ((fun_factor + difficulty_balance + addiction + polish) / 4) * 10
```

**Contribution to Final Score**: `player_one_score * 0.35`

---

### Bugcatcher -- QA (Weight: 0.40)

Bugcatcher is the quality assurance specialist, conducting systematic testing with diverse inputs over at least 15 minutes. This tester carries the highest weight because shipping a buggy game is worse than shipping no game. Bugcatcher's scoring is partially formula-driven based on objective bug counts.

| Subcriterion | Score Range | Description |
|-------------|-------------|-------------|
| Bugs Found | Severity-weighted | Scored based on the number and severity of bugs discovered. Each bug type carries a penalty: **Blocker** = -25 points, **Major** = -15 points, **Minor** = -5 points, **Cosmetic** = -2 points. Starting from a base of 100, penalties are subtracted. The floor is 0. Example: 1 major + 2 minor = 100 - 15 - 10 = 75 → scaled to 1-10 range (75/10 = 7.5). |
| Performance | 1-10 | How well does the game perform on mobile? Measured by frame rate consistency, load time, memory usage, and responsiveness to input. A score of 1 means the game is unplayably laggy. A score of 10 means the game runs at a smooth, consistent frame rate. |
| Console Errors | Count-based | Scored based on the number of JavaScript console errors observed during testing. 0 errors = 10, 1-2 errors = 8, 3-5 errors = 6, 6-10 errors = 4, 11-20 errors = 2, 21+ errors = 1. Only unique errors are counted (repeated identical errors count once). |
| Edge Cases | 1-10 | How well does the game handle unusual inputs and situations? Tested scenarios include: rapid tapping, multi-touch, screen rotation, backgrounding/foregrounding, very fast play, very slow play, and boundary conditions. A score of 1 means the game crashes on common edge cases. A score of 10 means the game handles all edge cases gracefully. |

**Category Score Calculation**:
```
bugcatcher_score = ((bugs_found_score + performance + console_errors_score + edge_cases) / 4) * 10
```

**Contribution to Final Score**: `bugcatcher_score * 0.40`

**Special Rule**: Regardless of the composite score, the presence of any **blocker** severity bug automatically triggers a REVISE verdict with the bug report sent to the Developer.

---

### AdCheck -- Monetization Integration (Weight: 0.25)

AdCheck evaluates the implemented monetization features by reaching at least 3 ad trigger points during testing. This tester verifies that the monetization design from the plan was correctly implemented and functions properly.

| Subcriterion | Score Range | Description |
|-------------|-------------|-------------|
| Ad Timing | 1-10 | Are ads shown at appropriate moments (natural pause points, between stages, after death)? Do they avoid interrupting active gameplay? A score of 1 means ads interrupt gameplay at the worst possible moments. A score of 10 means every ad appears at a perfectly natural break point. |
| Reward Value | 1-10 | For rewarded ads, is the reward valuable enough to motivate watching but not so valuable it feels required? Is the reward-to-effort ratio balanced? A score of 1 means rewards are worthless or mandatory. A score of 10 means rewards feel generous and genuinely optional. |
| Technical Integration | 1-10 | Do the ad hooks function correctly? Are ad placeholders properly implemented? Do ad events (show, close, reward) trigger the correct game responses? A score of 1 means ad integration is broken. A score of 10 means all ad touchpoints function flawlessly. |

**Category Score Calculation**:
```
adcheck_score = ((ad_timing + reward_value + technical_integration) / 3) * 10
```

**Contribution to Final Score**: `adcheck_score * 0.25`

---

### Test Final Score Calculation

```
test_final_score = (player_one_score * 0.35) + (bugcatcher_score * 0.40) + (adcheck_score * 0.25)
```

**Example**:
```
Player One subcriteria:  [8, 7, 9, 7]    → category = (31/4)*10 = 77.5
Bugcatcher subcriteria:  [7.5, 8, 8, 6]  → category = (29.5/4)*10 = 73.75
AdCheck subcriteria:     [7, 6, 8]        → category = (21/3)*10 = 70

test_final_score = (77.5 * 0.35) + (73.75 * 0.40) + (70 * 0.25)
                 = 27.125 + 29.5 + 17.5
                 = 74.125 → SHIP
```

### Test Gate Decision

| Score Range | Verdict | Action |
|------------|---------|--------|
| 70-100 | SHIP | Game proceeds to Phase 7 (Deployment) |
| 50-69 (or any blocker/major bugs) | REVISE | Bug reports compiled and sent to Developer for fixes. After fixes, all 3 testers re-test. Maximum 2 fix rounds. If still below 70 after 2 rounds, the game is scrapped. |
| 0-49 | SCRAP | Game is permanently discarded. |

---

## Weight Rationale

### Why These Specific Weights?

**Idea Evaluation Weights**:
- Professor Ludus (0.35): Game design quality is the single most important factor. A technically feasible, marketable game with bad design will fail.
- Dr. Loop (0.25): Player psychology determines whether players stay. Without engagement hooks, even great designs fizzle.
- Cash (0.20): Monetization matters for sustainability but should not drive design decisions at the idea stage.
- Scout (0.20): Market viability provides a reality check but should not override creative quality.

**Plan Evaluation Weights**:
- Builder (0.40): At the plan stage, technical feasibility is paramount. An unimplementable plan wastes the most downstream resources.
- Joy (0.35): Fun assessment at the plan level catches engagement issues before expensive development.
- Profit (0.25): Business viability at the plan level ensures monetization is designed in, not bolted on.

**Test Evaluation Weights**:
- Bugcatcher (0.40): At the testing stage, quality is king. Shipping bugs damages reputation more than any other factor.
- Player One (0.35): Real player experience validates whether the game delivers on its design promise.
- AdCheck (0.25): Monetization integration must work correctly but is the least critical compared to quality and fun.

---

## Score Adjustment by Meta Leaders

Meta leaders (Director, Producer, Critic) can adjust the scoring system during Phase 8 wrap-up reviews. Adjustable parameters include:

| Parameter | Default | Adjustable Range | Required Consensus |
|-----------|---------|-----------------|-------------------|
| Judge weights | As specified above | +/- 0.10 per judge (must sum to 1.00) | 2/3 (conditional) |
| Pass thresholds | 70 for all gates | 60-80 | 3/3 (unanimous) |
| Revision threshold | 50 lower bound | 40-60 | 2/3 (conditional) |
| Max revision rounds | 2 | 1-3 | 2/3 (conditional) |
| Subcriteria definitions | As specified above | Wording changes only | 2/3 (conditional) |
| Adding/removing subcriteria | As specified above | Add or remove 1 per review | 3/3 (unanimous) |

All adjustments are recorded in `data/agent-performance.json` with justification and the consensus vote.
