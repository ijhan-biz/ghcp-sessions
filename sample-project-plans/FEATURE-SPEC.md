# 기능 스펙 카드 (완성본) — Plans 칸반 보드 엔진

> 이 문서는 **완성된 예시**입니다. Day1(좋은 입력)에서 만드는 Spec Pack v1 — User Story · Acceptance
> Criteria(정상/예외/경계) · Context Manifest · Test Matrix — 을 **끝까지 채운 형태**로,
> Day2(안전한 실행)에서 이 스펙이 그대로 테스트·구현·게이트로 이어진 결과를 보여 줍니다.
> 비식별 예시이며 secret·고객정보·운영 로그 원문이 없습니다(교육용).

## 무슨 앱인가 (persona · 바라는 점)
팀의 일을 **보드 → 리스트(단계) → 카드(할 일)** 로 정리하는 **Trello 유형 칸반 엔진**입니다.
카드에 **라벨·담당자·마감일·체크리스트·코멘트·첨부**를 붙이고, 카드를 리스트 사이로 **이동**하며,
**검색·통계**로 현황을 봅니다. "완성본"이라 강의에서 다룬 기법이 실제 코드·테스트·게이트로 모두 구현돼 있습니다.

## 설계 경계 (중요 — 강의의 핵심 결정)
- **부수효과는 경계 밖으로.** 실제 저장(DB/파일/클라우드)·실시간 협업(WebSocket)·파일 업로드는
  **비목표(non-goal)** 이며 **주입형 `store` 어댑터**로 분리했습니다. 테스트는 fake store 를 주입해
  로컬에서 **결정론적으로** 검증합니다(OS·네트워크 의존·비결정성 제거).
- **id 생성·시간**도 부수효과라 `engine` 이 **주입**(idgen/clock)받습니다. 순수 코어는 id·시각을
  **명시적 인자로만** 받아, 같은 입력 → 같은 출력(재현 가능).
- 도메인 로직(구조 변경·집계·검색)은 **순수 함수**입니다. 첨부는 **메타데이터(이름·URL)만** 다룹니다.

## User Story
- **As** 팀의 담당자/PL, **I want** 일을 카드로 만들어 단계별 리스트로 옮기고 라벨·마감·체크리스트로 관리하며,
  **so that** 누가 무엇을 언제까지 하는지와 지연(마감초과)을 한눈에 본다.

## 기능 목록 (Trello 대응 — 모두 구현·테스트됨)
| 영역 | 기능 | 코어 함수 / 엔진 메서드 |
| --- | --- | --- |
| 보드 | 생성·이름변경·보관·삭제·복사·멤버 | `addBoard` … `copyBoard`, `addBoardMember` |
| 리스트 | 생성·이름변경·순서이동·보관·삭제·복사 | `addList` … `moveList`, `copyList` |
| 카드 | 생성·수정·이동(리스트 내/간)·보관·삭제·복사 | `addCard`, `moveCard`, `copyCard` |
| 라벨 | 보드 라벨 정의·배정·해제·필터 | `addLabelDef`, `assignLabel`, `search({labelIds})` |
| 멤버 | 카드 담당자 배정·해제·필터 | `addCardMember`, `search({memberIds})` |
| 마감 | 설정·해제·완료·마감초과 | `setDue`, `setDueDone`, `isOverdue` |
| 체크리스트 | 추가·항목·토글·진행률 | `addChecklist`, `toggleChecklistItem`, `checklistProgress` |
| 코멘트 | 추가·수정·삭제 | `addComment` … |
| 첨부(메타) | 추가·삭제 | `addAttachment`, `removeAttachment` |
| 조회 | 검색·통계·보드 렌더 | `search`, `boardStats`, `renderBoard` |
| 저장 | 주입형 로드/저장 | `loadState`, `saveState` (fake store) |

## Acceptance Criteria (정상 · 예외 · 경계)
| AC | 범주 | 내용 | 검증 |
| --- | --- | --- | --- |
| AC1 | 정상 | 카드를 다른 리스트로 이동하면 원본 order 에서 빠지고 대상 order·listId 가 갱신된다 | `npm test` (board) |
| AC2 | 정상 | 라벨/멤버 필터는 AND 로 결합되어 해당 카드만 반환한다 | `npm test` (query) |
| AC3 | 정상 | 체크리스트 진행률은 완료/전체 비율(%)로 계산된다 | `npm test` (card) |
| AC4 | 정상 | 마감이 지났고 미완이면 overdue 로 잡힌다(완료면 아님) | `npm test` (card/query) |
| AC5 | 경계 | 이동 인덱스가 범위를 벗어나면 끝으로 clamp 된다 | `npm test` (board) |
| AC6 | 경계 | 체크리스트 항목이 0개면 진행률은 0% | `npm test` (card) |
| AC7 | 경계 | 기본 조회/검색은 보관(archived) 항목을 제외, 옵션으로 포함 | `npm test` (board/query) |
| AC8 | 예외 | 부모(보드/리스트) 없음·빈 title·중복 id 는 상태를 바꾸지 않는다(no-op) | `npm test` (board) |
| AC9 | 예외 | 보드에 정의되지 않은 라벨·보드 멤버 아닌 사람은 카드에 배정되지 않는다 | `npm test` (card) |
| AC10 | 예외 | store 미주입/실패/부적합 데이터에서도 load 는 초기 상태로 안전 폴백 | `npm test` (store) |
| AC11 | 정상 | 카드 복사는 라벨·멤버·마감·체크리스트를 깊은 복사하되 코멘트는 복사하지 않는다(새 id) | `npm test` (engine) |
| AC12 | 정상 | 보드 복사는 라벨 id 를 재매핑하고 카드가 새 라벨을 참조한다 | `npm test` (engine) |

## Context Manifest (allowed / blocked / test)
| 구분 | 파일 | 의미 |
| --- | --- | --- |
| allowed | `src/*.js` | 도메인 코어·엔진 수정 허용 |
| allowed | `test/*.test.js` | 테스트 |
| blocked | `.env`, `prod/*`, `secrets/*` | 변경 금지(`policy-check` 감지) |
| test | `test/*.test.js` | 검증 파일(`npm test`) |
| unknown | 실제 DB/파일/클라우드 어댑터 | 과정 범위 밖(비목표) — fake store 로 대체 |

## 제외 범위 (non-goal)
DB/클라우드 동기화·실시간 협업(WebSocket), 실제 파일 업로드, 인증/권한 서버, UI 프레임워크(React 등).
— 순수 코어의 부수효과는 경계(`store`/`engine`)로만 표현한다.

> 참고: **실행 가능한 웹앱**(`server.js` + `public/`)은 이 경계 위에 **얇은 파일 store**(`src/file-store.js`)와
> **프레임워크 없는 vanilla UI** 를 엹은 것이다. 도메인 코어는 그대로 **순수**이고, 서버는 REST(`src/api.js`)를
> 통해 같은 엔진을 호출할 뿐이다(입력 검증은 API 경계에서). 즉 "실행 서비스"는 비목표가 아니라, 그 설계가 의도한 교체 지점이다.

## 검증 방법
- `npm start` : 웹 서버 실행(http://localhost:3000) — 백엔드+프론트엔드를 브라우저에서 E2E 확인.
- `npm test` : 유닛 + API(`test/api.test.js`) + E2E(`test/e2e.test.js`, 서버 부팅·fetch·재시작 영속화) — 전부 green(0 skip).
- `npm run gate` : lint + test + policy-check(로컬 품질 게이트).
- `npm run demo` : 완성 보드를 텍스트로 렌더(시연).

## 민감정보 제거 확인
- [x] 고객명/계정/키/운영 로그 원문 없음. 멤버는 `alice`·`bob` 같은 비식별 예시. 비식별 전제.
