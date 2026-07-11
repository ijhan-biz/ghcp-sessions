# sample-project-plans — 완성본 예시 (Trello 유형 칸반 보드 엔진)

**강의 전 과정을 "끝까지 완성한" 레퍼런스 프로젝트**입니다. 옆의 [`sample-project-activity-log`](../sample-project-activity-log/)
가 참가자가 직접 채워 나가는 **전원 공통 실습(일부 TODO·skip)** 이라면, 이 프로젝트는 그 실습이 **완성되면 어떤 모습이 되는지**를
보여 주는 **완성본**입니다 — 스펙 → 하네스 → 게이트 → SDD 구현 → 커스텀 스킬/에이전트까지 모두 채워져 있고,
**테스트가 전부 green(0 skip)** 이며, 순수 로직 코어 위에 **실제로 실행되는 백엔드 + 프론트엔드 웹앱**을 올려
 **[Trello](https://trello.com/) 의 핵심 기능을 E2E 로 재현**합니다(보드·리스트·카드·드래그앤드롭·라벨·멤버·마감·체크리스트·코멘트·검색).

> 도메인: 팀의 일을 **보드 → 리스트(단계) → 카드(할 일)** 로 관리하는 칸반. 의존성 없이 **Node 18+** 로 동작(빌드 단계 없음).

## 시작
```sh
cd sample-project-plans
npm start       # 웹 서버 실행 → http://localhost:3000 (브라우저로 열기)
npm test        # 전체 green (0 skip) — 유닛 + API + E2E(서버 부팅)
npm run demo    # 완성 보드를 텍스트로 렌더(시연용)
npm run gate    # lint + test + policy-check
```

## 실행 (웹 서비스 — 백엔드 + 프론트엔드, 한 번에 시작)
`node:http` 만으로 동작하는 **의존성 0 서버**입니다(프레임워크·빌드 없음). **`npm install` 도 필요 없습니다.**
```sh
npm start                 # 기본 3000, 사용 중이면 자동으로 다음 빈 포트로 대체
PORT=8137 npm start       # 포트 지정
PLANS_DATA=./data/plans.json npm start   # 상태 저장 파일 지정(기본 data/plans.json)
```
실행하면 콘솔에 **실제 주소**가 찍힙니다 → `✓ Plans 서버 실행 → http://localhost:<포트>`. 그 주소를 브라우저로 엽니다.

## 사용법 (브라우저 UI)
처음 열면 보드가 없습니다. 아래 순서대로 하면 바로 씁니다.

1. **보드 만들기** — 왼쪽 사이드바 `+ 새 보드` → 제목 입력 후 Enter. 사이드바에서 보드를 눌러 전환.
2. **리스트(단계) 추가** — 보드 오른쪽 끝 `+ 리스트 제목` 칸에 입력 후 Enter (예: To Do / Doing / Done).
   - 리스트 헤더 아이콘: `◀ ▶` 순서 이동 · `⧉` 복사 · `🗄` 보관/해제 · `🗑` 삭제 · 제목 **더블클릭** 으로 이름 변경.
3. **카드 추가** — 리스트 아래 `+ 카드 추가` 칸에 입력 후 Enter.
4. **카드 이동** — 카드를 **드래그**해서 다른 리스트/위치에 놓기. 순서가 저장됩니다.
5. **카드 상세(클릭)** — 카드를 클릭하면 모달이 열립니다:
   **제목·설명** 편집 · **라벨** 토글과 `+ 새 라벨`(이름·색) · **멤버** 배정(보드 멤버만) · **마감일** 설정/완료/제거 ·
   **체크리스트**(항목 추가·체크, 진행률 %) · **코멘트** · **첨부**(이름+URL) · 오른쪽 **복사 / 보관 / 삭제**.
6. **라벨·멤버 관리(보드 단위)** — 상단 `라벨` / `멤버` 버튼으로 보드 라벨·멤버를 만들고 지웁니다.
7. **검색·필터** — 상단 검색창(제목·설명 부분일치) + `마감` 드롭다운(지남/있음/없음/완료). 조합하면 매칭 카드만 보입니다.
8. **보관** — 상단 `보관` 버튼으로 보드 보관/해제. 보관된 리스트·카드는 기본 화면에서 숨겨집니다.

> 저장은 **자동**입니다(변경 즉시 파일에 기록). 서버를 껐다 켜도 그대로 유지됩니다.

## REST API 레퍼런스
프론트엔드는 아래 JSON API 를 씁니다(직접 호출·자동화도 가능). 본문은 `application/json`.

| 메서드 · 경로 | 설명 |
| --- | --- |
| `GET /api/boards` · `POST /api/boards` `{title}` | 보드 목록 / 생성`→{id}` |
| `GET /api/boards/:id` | 보드 렌더(리스트·카드·배지) + 통계 |
| `PATCH /api/boards/:id` `{title?,archived?}` · `DELETE /api/boards/:id` | 이름변경·보관 / 삭제 |
| `POST /api/boards/:id/copy` `{title?}` | 보드 복사 |
| `POST /api/boards/:id/members` `{memberId}` · `DELETE …/members/:m` | 보드 멤버 |
| `POST /api/boards/:id/labels` `{name,color}` · `PATCH`·`DELETE …/labels/:l` | 보드 라벨 |
| `GET /api/boards/:id/search?text=&label=&member=&due=` | 검색(due=overdue·set·none·complete) |
| `POST /api/boards/:id/lists` `{title}` | 리스트 추가 |
| `PATCH /api/lists/:id` `{title?,archived?}` · `DELETE /api/lists/:id` | 리스트 수정 / 삭제 |
| `POST /api/lists/:id/move` `{toIndex}` · `POST /api/lists/:id/copy` | 리스트 이동 / 복사 |
| `POST /api/lists/:id/cards` `{title}` | 카드 추가 |
| `GET /api/cards/:id` | 카드 상세(+보드 라벨·멤버) |
| `PATCH /api/cards/:id` `{title?,desc?,archived?}` · `DELETE /api/cards/:id` | 카드 수정 / 삭제 |
| `POST /api/cards/:id/move` `{toListId?,toIndex?}` · `POST /api/cards/:id/copy` | 카드 이동 / 복사 |
| `POST`·`DELETE /api/cards/:id/labels[/:l]` `{labelId}` | 라벨 배정 / 해제 |
| `POST`·`DELETE /api/cards/:id/members[/:m]` `{memberId}` | 멤버 배정 / 해제 |
| `PUT /api/cards/:id/due` `{at,done?}` · `DELETE …/due` · `POST …/due/complete` `{done}` | 마감 |
| `POST`·`DELETE /api/cards/:id/checklists[/:cl]` `{title}` | 체크리스트 |
| `POST`·`PATCH`·`DELETE /api/cards/:id/checklists/:cl/items[/:it]` `{text}`·`{done}` | 항목 |
| `POST`·`PATCH`·`DELETE /api/cards/:id/comments[/:cm]` `{author?,text}` | 코멘트 |
| `POST`·`DELETE /api/cards/:id/attachments[/:a]` `{name,url?}` | 첨부(메타) |

```sh
# 예시: 보드 → 리스트 만들기
curl -s localhost:3000/api/boards
BID=$(curl -s -X POST localhost:3000/api/boards -H 'content-type: application/json' -d '{"title":"내 보드"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).id')
curl -s -X POST localhost:3000/api/boards/$BID/lists -H 'content-type: application/json' -d '{"title":"To Do"}'
```

## 데이터 · 설정 · 초기화
- **포트**: `PORT`(기본 3000). 사용 중이면 자동으로 다음 빈 포트로 대체합니다.
- **저장 파일**: `PLANS_DATA`(기본 `data/plans.json`, gitignore 됨). 변경 즉시 저장, 재시작해도 유지.
- **초기화**: 서버를 끄고 `rm data/plans.json` 후 다시 `npm start` → 깨끗한 빈 상태로 시작.
- 아키텍처: 브라우저(`public/`) → REST(`src/api.js`) → 순수 엔진(`src/plans.js`) → 저장 경계(`src/file-store.js`). **UI도 순수 코어를 재사용**합니다.


## 이 완성본이 담은 "강의 내용" (세션 ↔ 산출물)
| 세션 | 강의 개념 | 이 프로젝트의 산출물 |
| --- | --- | --- |
| D1-S1 토큰·가드레일 | 범위 한정·비식별 스펙 | [`FEATURE-SPEC.md`](FEATURE-SPEC.md), `npm run token-estimate` |
| D1-S2 좋은 프롬프트 | AC ↔ 테스트 매핑 | `test/*.test.js`(정상·예외·경계), `npm run spec-check` |
| D1-S3 Context Manifest | allowed/blocked 분리 | [`templates/context-manifest.md`](templates/context-manifest.md) |
| D1-S4 Plan·Test Matrix | 계획·검증·롤백 선고정 | [`templates/plan-and-test-matrix.md`](templates/plan-and-test-matrix.md) |
| D2-S1~S2 하네스·게이트 | 로컬 결정론 게이트 | `scripts/lint·policy-check`, `npm run gate` |
| D2-S2 Agent Teams | 역할=에이전트 1파일 | [`.github/agents/`](.github/agents) (orchestrator·planner·generator·evaluator·harness) |
| D2-S3 장기 실행 안전장치 | cost burn·checkpoint·canary | `npm run sim` |
| D2-S4~S5 SDD test-first | 실패 테스트 → 최소 구현 → 게이트 | `src/*.js` + `test/*.test.js` + `npm run packet` |
| D2-S6 Custom Skill/Agent·라우팅 | 재사용 스킬·모델 라우팅 | [`skills/`](skills), `.github/agents/`, `npm run routing` |
| D2-S7 경험 공유 | 라이트닝 토크·핸드오프 | [`templates/lightning-talk-and-handoff.md`](templates/lightning-talk-and-handoff.md) |

## 구조
```
sample-project-plans/
  server.js  의존성 0 HTTP 서버(node:http) — 정적 public/ + /api/*
  public/    프론트엔드 SPA(vanilla JS, 빌드 없음) — index.html·style.css·app.js
  src/       도메인 코어(순수) + 엔진/경계
    state.js    정규화 상태 모양 + 불변 헬퍼
    board.js    보드/리스트/카드 구조(생성·이동·보관·삭제)
    card.js     카드 상세(라벨·멤버·마감·체크리스트·코멘트·첨부)
    query.js    조회(검색·필터·통계·렌더)
    store.js    저장 경계(주입형 store — fake 로 테스트)
    file-store.js  파일 기반 store 어댑터(서버용 영속화)
    api.js      REST 라우터(HTTP와 분리된 순수 디스패치)
    engine.js   id/clock/store 주입 + 복사 합성 + 데모 시드
    plans.js    배럴(진입점)
  test/      유닛 + API + E2E(서버 부팅·fetch) — 전부 green
  scripts/   게이트·데모·시뮬레이션(의존성 0)
  templates/ 스펙·매트릭스·롤백·핸드오프·에이전트 캔버스(완성)
  skills/    Custom Skill 예시(SDD 보조 · Plans 도메인)
  .github/   copilot-instructions · agents · prompts · instructions
```

## 빠른 명령
| 명령 | 설명 |
| --- | --- |
| `npm start` | 웹 서버 실행(http://localhost:3000) — 백엔드+프론트엔드 |
| `npm test` | 유닛 + API + E2E(서버 부팅) — 전부 green |
| `npm run demo` | 시드 보드 렌더(라벨·마감·체크리스트·통계) |
| `npm run spec-check` | 스펙 자가검증(정상·예외·경계 AC·비식별) |
| `npm run lint` | 의존성 없는 구문 검사(node --check) |
| `npm run policy-check` | 금지 파일/secret 패턴 감지 |
| `npm run gate` | lint + test + policy-check |
| `npm run sim` | 장기 실행 안전장치 시뮬레이션 |
| `npm run packet` | local review packet 생성(PR 대체) |
| `npm run routing` | 단계별 모델 라우팅 데모 |
| `node scripts/token-estimate.mjs <파일...>` | 첨부 토큰 근사치(범위 한정 효과) |

## 설계 요약 (왜 이렇게 나눴나)
- **순수 코어 + 주입 경계**: 구조 변경·집계·검색은 순수 함수(결정론). 저장·id·시간 같은 부수효과는
  `store`/`engine` 으로 밀어내 테스트에서 fake 로 대체 → OS·네트워크 없이 재현 가능.
- **정규화 상태**(boards/lists/cards 평면 맵 + order 배열): 카드 이동·재정렬이 splice 로 끝나 깊은 중첩 갱신을 피함.
- **불변 갱신**: 모든 변경 함수는 새 상태를 반환하고 입력을 건드리지 않음(테스트에서 원본 불변 검증).

## 주의
- 제품 기능·모델명·가격·경로는 시점에 따라 바뀝니다(release-time recheck). 운영 전 공식 문서로 재확인하세요.
- 비식별 전제: 고객정보·키/토큰·운영 로그 원문 없음(교육용). 실제 저장/업로드/실시간은 비목표입니다.

---
GitHub Copilot 중급과정 · 완성본 레퍼런스 · 작성: 한익준 (Microsoft)
