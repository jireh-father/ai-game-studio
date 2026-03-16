# AI Game Studio

## Core Goal: Continuous Self-Evolution

The #1 goal of this entire system is to **continuously evolve and improve itself with every run**. Every pipeline execution — whether `/game-studio` or `/evolve-game` — MUST leave the system better than it found it. This means:

- **Agents improve**: Retrospective phases (Phase 9) evaluate every agent, adjust prompts, hire/fire agents, and restructure teams based on performance data.
- **Quality ratchets up**: Lessons learned from each run are encoded into agent prompts, scoring thresholds, and pipeline rules — never repeated mistakes.
- **Process optimizes**: Bottlenecks discovered in one run are eliminated in the next. Scoring calibration, timing budgets, and gate thresholds adapt.
- **The pipeline is a living system, not a static tool.** Treat every run as training data for the next run.

---

에이전트 팀 기반 자동 게임 제작 파이프라인.
"게임 N개 만들어줘" → 아이디어 → 검증 → 기획 → 개발 → 테스트(Playwright) → 버그수정 → gh-pages 배포 → Slack 알림까지 완전 자동.

## How to Run

`/game-studio` 슬래시 커맨드 실행 후 "게임 N개 만들어줘" 요청.
오케스트레이션 전체 로직은 `.claude/agents/game-studio.md` 참조.

`/evolve-game {slug}` 슬래시 커맨드로 기존 게임을 진화시킴.
에볼루션 파이프라인 로직은 `.claude/agents/evolve-game.md` 참조.

## Project Structure

```
.claude/agents/                 ← 모든 에이전트 (YAML frontmatter 포함, 공식 에이전트 포맷)
  game-studio.md                ← 파이프라인 오케스트레이터 (/game-studio)
  evolve-game.md                ← 에볼루션 파이프라인 오케스트레이터 (/evolve-game)
  spark.md, oddball.md, ...     ← 5개 아이디에이터
  professor-ludus.md, ...       ← 5개 아이디어 심사위원
  architect.md                  ← 게임 기획자
  builder.md, joy.md, profit.md ← 3개 기획 심사위원
  developer.md                  ← 게임 개발자 (opus)
  player-one.md, bugcatcher.md, replay-tester.md ← 3개 테스터
  shipper.md                    ← 배포 담당
  director.md, producer.md, meta-critic.md ← 3개 메타 리더
  game-analyzer.md              ← 게임 분석 에이전트
  *-evolver.md (6개)            ← 에볼버 에이전트
  casual-critic.md, ... (6개)   ← 에볼루션 리뷰어
  speed-runner.md, ... (3개)    ← 에볼루션 테스터
  upgrader.md                   ← 업그레이더 (opus)
docs/                           ← 파이프라인 문서, 점수제 명세, 템플릿
data/                           ← 아이디어 DB, 에이전트 성과, 파이프라인 실행 데이터
games/                          ← 생성된 게임 (games/{slug}/)
```

## Available Tools

- **Agent Teams**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 활성화됨
- **Playwright**: MCP 플러그인 활성화 (테스트용)
- **Slack**: MCP 플러그인 활성화 (알림용)

## Screenshot Rule

All test/deploy screenshots MUST be saved to `./tmp/` directory (create if missing). Never save screenshots to the project root. Filename pattern: `./tmp/{slug}-{context}.png`.

## Agent Self-Report System (added run-008)

Every agent MUST write a `## Self-Report` section at the end of their output. The orchestrator saves these to `{run_id}/retrospective/agent-reports/`. Phase 9 meta-leaders use these self-reports as primary input for the retrospective. See `game-studio.md` → "Agent Self-Report Protocol" for full spec.

## Prompt Language Rule

All prompts (agent prompts, orchestrator prompts, system instructions, etc.) MUST be written in English. Korean is only allowed in example cases demonstrating user-facing content (e.g., example user requests like "게임 3개 만들어줘").
