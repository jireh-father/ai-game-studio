# AI Game Studio - Project Instructions

## Overview

이 프로젝트는 에이전트 팀 기반 자동 게임 제작 파이프라인이다.
"게임 N개 만들어줘"라는 요청을 받으면 아이디어 생성 → 검증 → 기획 → 개발 → 테스트 → 버그수정 → gh-pages 배포 → Slack 알림까지 완전 자동으로 진행한다.

## Key Technologies

- **Claude Code Agent Teams** (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`)
- **Playwright** for game testing (MCP plugin already enabled)
- **Slack** for progress notifications (MCP plugin already enabled)
- **gh-pages** for deployment

## Game Tech Spec

- **Engine**: Phaser 3 (CDN: `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js`)
- **Alt Engines**: PixiJS (`https://cdn.jsdelivr.net/npm/pixi.js@7/dist/pixi.min.js`), vanilla Canvas
- **Audio**: Howler.js (`https://cdn.jsdelivr.net/npm/howler@2/dist/howler.min.js`)
- **Graphics**: SVG generated in-code (no external assets needed)
- **Target**: Mobile web (360-428px width, touch-only)
- **File Structure**: `index.html` + `css/style.css` + `js/{config,main,game,stages,ui,ads}.js`
- **Constraints**: JS 파일당 300줄 이내, npm/빌드 없이 index.html 직접 실행

## Pipeline Execution

### Entry Point

`/game-studio` 슬래시 커맨드 또는 "게임 N개 만들어줘" 요청 시 파이프라인 실행.

### Phase 0: Initialization

1. `TeamCreate(team_name: "game-pipeline-YYYYMMDD-NNN")`
2. Slack 알림: "게임 N개 제작 파이프라인 시작"
3. 메타 리더 3인 스폰 (director, producer, critic)
   - 각 에이전트의 프롬프트는 `agents/` 폴더의 .md 파일을 Read하여 Agent tool의 `prompt` 파라미터로 전달

### Phase 1: Idea Generation (병렬)

1. `data/ideas-database.json` 로드 (기존 아이디어 확인)
2. 목표: N × 3개 아이디어 생성
3. Spark, Oddball, Trendsetter를 병렬 스폰
4. 중복 검사: 제목 유사도 + 메카닉 태그 3+겹침 + 원라이너 비교
5. `pipeline-runs/run-XXX/ideas-raw.json` 저장
6. Slack 알림: "아이디어 M개 생성 완료, 검증 시작"
7. 메타 리더 Phase 1 리뷰

### Phase 2: Idea Validation (아이디어당 4명 병렬)

1. Professor Ludus(0.35), Dr. Loop(0.25), Cash(0.20), Scout(0.20) 스폰
2. 가중 점수 계산 → 70점+ 통과
3. N개 미달 시 Phase 1으로 부족분 추가 생성
4. `ideas-evaluated.json`, `ideas-passed.json` 저장
5. Slack 알림: "K개 아이디어 통과, 기획 시작"

### Phase 3: Planning (통과 아이디어별)

1. Architect가 상세 기획서 작성 (`docs/templates/game-design-doc-template.md` 기반)
2. `pipeline-runs/run-XXX/plans/` 저장

### Phase 4: Plan Validation (기획당 3명 병렬)

1. Builder(0.40), Joy(0.35), Profit(0.25) 스폰
2. 70점+ → 개발 진행
3. 50-69점 → 피드백 전달 후 수정, 재검증 (최대 2회)
4. 50 미만 → 폐기, 다음 아이디어로 대체
5. `plan-evaluations/` 저장
6. Slack 알림: "J개 기획 통과, 개발 시작"
7. 메타 리더 Phase 2-4 리뷰

### Phase 5: Development (게임별)

1. Developer 스폰, 기획서 기반 구현
2. `games/{slug}/` 에 모듈화 코드 생성
3. Slack 알림: "게임 '{title}' 개발 완료, 테스트 시작"

### Phase 6: Testing + Bug Fix Loop

1. 로컬 HTTP 서버 시작 (`npx http-server games/{slug} -p 8080`)
2. Player One(0.35), Bugcatcher(0.40), AdCheck(0.25) 스폰 → Playwright로 실행
3. 테스터 플레이 프로토콜:
   - Player One: 최소 10스테이지 클리어 + 3회 실패 경험
   - Bugcatcher: 최소 15분 다양한 입력 테스트
   - AdCheck: 최소 3회 광고 트리거 시점 도달
4. 버그 리포트 작성 → `bug-reports/` 저장
5. 판정:
   - 70점+ → SHIP
   - 50-69점 or blocker/major 버그 → Developer에게 버그 리포트 전달 → 수정 → 재테스트 (최대 2회)
   - 50 미만 → 폐기
6. Slack 알림: "게임 '{title}' XX점 → SHIP/REVISE/SCRAP"

### Phase 7: Deployment (SHIP만)

1. Shipper가 `git add → commit → gh-pages` 배포
2. URL 생성
3. Slack 알림: "게임 '{title}' 배포 완료: {URL}"

### Phase 8: Wrap-up

1. 메타 리더 최종 리뷰
   - 에이전트 성과 분석 → `agent-performance.json` 업데이트
   - 합의 시 `agents/` 프롬프트 파일 수정/추가/삭제
2. `ideas-database.json` 마스터 업데이트
3. `run-summary.md` 생성
4. 모든 팀원 `SendMessage(type: "shutdown_request")`
5. `TeamDelete`
6. Slack 알림: "전체 결과: N개 요청 → X개 배포, Y개 폐기"

## Agent Spawning Protocol

에이전트를 스폰할 때:
1. 해당 에이전트의 프롬프트 파일을 `Read` tool로 읽기
2. `Agent` tool 호출 시 `prompt` 파라미터에 읽은 내용 + 컨텍스트(현재 작업, 참고 데이터) 전달
3. `team_name` 파라미터로 현재 팀에 소속
4. `name` 파라미터로 에이전트 이름 지정
5. `subagent_type: "general-purpose"` 사용

## Scoring System

### Idea Evaluation (4 judges, weighted)
- Professor Ludus (Game Design): 0.35
- Dr. Loop (Player Psychology): 0.25
- Cash (Monetization): 0.20
- Scout (Market Viability): 0.20

### Plan Evaluation (3 judges, weighted)
- Builder (Technical Feasibility): 0.40
- Joy (Fun/Engagement): 0.35
- Profit (Business Viability): 0.25

### Test Evaluation (3 testers, weighted)
- Player One (Player Experience): 0.35
- Bugcatcher (QA): 0.40
- AdCheck (Monetization Integration): 0.25

### Gates
- Idea: 70+ pass, below fail
- Plan: 70+ pass, 50-69 revise (max 2), below scrap
- Test: 70+ ship, 50-69 fix+retest (max 2), below scrap

## Meta Leader Protocol

3명의 메타 리더(Director, Producer, Critic)가 각 주요 단계 완료 후 리뷰:
1. 각자 독립 피드백 작성
2. SendMessage로 피드백 교환 후 토론
3. 변경 합의:
   - 만장일치(3/3) → 즉시 실행
   - 2인 동의 → 조건부 실행 (1회 시범)
   - 1인만 → 보류
4. 결과를 `meta-leader-reviews/`에 기록

## Duplicate Detection

아이디어 생성 전 `data/ideas-database.json`을 읽고:
- 제목 유사도 체크
- 메카닉 태그 3개 이상 겹침 체크
- 원라이너 비교
중복 판정 시 재생성

## Slack Notifications

주요 시점마다 Slack으로 사용자에게 알림 전송:
- 파이프라인 시작/완료
- 각 Phase 완료
- 게임별 테스트 결과
- 메타 리더 합의 결정
- 배포 URL

## File Conventions

- Agent prompts: `agents/{category}/{name}.md`
- Pipeline data: `data/pipeline-runs/run-YYYY-MM-DD-NNN/`
- Games: `games/{slug}/`
- Templates: `docs/templates/`
