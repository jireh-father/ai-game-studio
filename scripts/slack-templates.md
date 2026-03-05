# Slack Notification Templates

Fixed-format mrkdwn templates for each pipeline event.
The orchestrator MUST use these exact templates — fill in `{variables}` and send via `slack_send_message` to channel `C0AJFQ75TMY`.

**Rules**:
- Use EXACTLY the format below — do not rephrase, reorder, or add extra content
- Replace `{variables}` with actual values
- Repeat `{row}` blocks for each item in the list
- All scores are displayed as integers (no decimals)

---

## 1. `pipeline-start` — Phase 0 Complete

```
🎮 *Pipeline Started*
━━━━━━━━━━━━━━━━━━━
*Run ID*: `{run_id}`
*Games Requested*: {N}
*Date*: {YYYY-MM-DD}
```

---

## 2. `ideation-done` — Phase 1 Complete

```
💡 *Ideation Complete*
━━━━━━━━━━━━━━━━━━━
*Run*: `{run_id}`
*Ideas Generated*: {total_count}
• spark: {spark_count} ideas
• oddball: {oddball_count} ideas
• trendsetter: {trendsetter_count} ideas

Starting validation →
```

---

## 3. `validation-done` — Phase 2 Complete

```
✅ *Idea Validation Complete*
━━━━━━━━━━━━━━━━━━━━━━━━━━
*Run*: `{run_id}` | *Passed*: {passed}/{total} | *Threshold*: 70+

| Game | Creator | Score | Result |
{for each idea}
| {title} | {creator} | {score} | {PASS/FAIL} |
{end for}

Starting planning →
```

---

## 4. `planning-done` — Phase 4 Complete

```
📋 *Plan Validation Complete*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Run*: `{run_id}` | *Passed*: {passed}/{total}

| Game | Builder | Joy | Profit | Weighted |
{for each plan}
| {title} | {builder} | {joy} | {profit} | *{weighted}* |
{end for}

Starting development →
```

---

## 5. `dev-done` — Phase 5, Per Game

```
🔨 *Development Complete*: {title}
*Run*: `{run_id}` | *Slug*: `{slug}`
*Files*: {file_count} JS | *Max lines*: {max_lines}
```

---

## 6. `test-done` — Phase 6, Per Game

```
🧪 *Test Result*: {title}
*Run*: `{run_id}` | *Verdict*: *{SHIP/REVISE/SCRAP}*

| Tester | Score |
| Player One | {po_score} |
| BugCatcher | {bc_score} |
| Replay Tester | {rt_score} |
| *Weighted* | *{weighted}* |

{if bugs}
*Bugs Found*: {bug_count}
{for each bug}
• `{severity}` — {description}
{end for}
{end if}
```

---

## 7. `deploy-done` — Phase 7, Per Game

```
🚀 *Deployed*: {title}
{play_url}
```

---

## 8. `pipeline-done` — Phase 8 Complete

```
🏁 *Pipeline Complete*
━━━━━━━━━━━━━━━━━━━━
*Run*: `{run_id}`
*Requested*: {N} → *Shipped*: {shipped} | *Scrapped*: {scrapped}

*Shipped Games*:
{for each shipped game}
{i}. <{play_url}|{title}> ({weighted_score}점)
{end for}

📊 *Report*: <{report_url}|View Pipeline Report>
```

---

## 9. `retro-done` — Phase 9 Complete

```
🔄 *Retrospective Complete*
━━━━━━━━━━━━━━━━━━━━━━━━━
*Run*: `{run_id}`
*Auto-applied*: {auto_count} improvements
*Pending review*: {pending_count} proposals
*Scripts created*: {script_count}

{if auto_count > 0}
*Applied Changes*:
{for each applied}
• `{agent_file}` — {change_summary}
{end for}
{end if}
```

---

## Batch Notification (Optional)

For runs with 5+ games, combine `dev-done` and `deploy-done` into batch messages:

### `dev-batch-done` — All Development Complete

```
🔨 *All Development Complete*
━━━━━━━━━━━━━━━━━━━━━━━━━━
*Run*: `{run_id}` | *Games Built*: {count}

| # | Game | JS Files | Max Lines |
{for each game}
| {i} | {title} | {file_count} | {max_lines} |
{end for}

Starting testing →
```

### `deploy-batch-done` — All Deployment Complete

```
🚀 *All Games Deployed*
━━━━━━━━━━━━━━━━━━━━━━━━
*Run*: `{run_id}` | *Games*: {count}

{for each game}
{i}. <{play_url}|{title}>
{end for}
```
