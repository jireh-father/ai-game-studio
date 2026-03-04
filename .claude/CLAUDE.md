# AI Game Studio

에이전트 팀 기반 자동 게임 제작 파이프라인.
"게임 N개 만들어줘" → 아이디어 → 검증 → 기획 → 개발 → 테스트(Playwright) → 버그수정 → gh-pages 배포 → Slack 알림까지 완전 자동.

## How to Run

`/game-studio` 슬래시 커맨드 실행 후 "게임 N개 만들어줘" 요청.
오케스트레이션 전체 로직은 `.claude/agents/game-studio.md` 참조.

## Project Structure

```
.claude/agents/game-studio.md   ← 파이프라인 오케스트레이터 (/game-studio)
agents/                         ← 19개 서브에이전트 프롬프트 (각자 역할/기준/프로토콜 포함)
docs/                           ← 파이프라인 문서, 점수제 명세, 템플릿
data/                           ← 아이디어 DB, 에이전트 성과, 파이프라인 실행 데이터
games/                          ← 생성된 게임 (games/{slug}/)
```

## Available Tools

- **Agent Teams**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 활성화됨
- **Playwright**: MCP 플러그인 활성화 (테스트용)
- **Slack**: MCP 플러그인 활성화 (알림용)
