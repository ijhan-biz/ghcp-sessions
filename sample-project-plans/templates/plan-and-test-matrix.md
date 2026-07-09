# Plan + Test Matrix (완성 예시 · Day1-S4)

> 코드 작성 전에 계획·검증·롤백을 먼저 고정한다. Definition of Done: Code + Test + Required Check + Doc + Rollback Path.

## 구현 계획 (실제로 걸어온 단계)
1. 변경 목표: Trello 핵심 기능을 순수 코어 + 주입 경계로 구현
2. 변경 파일 후보 + 근거(Context Manifest): `src/*.js`(코어·엔진), `test/*.test.js`(검증)
3. 단계 / stop point:
   - 1단계: 상태 모양·구조 CRUD·이동 → 멈추고 board 테스트 green 확인
   - 2단계: 카드 상세(라벨·멤버·마감·체크리스트·코멘트·첨부) → card 테스트 green
   - 3단계: 조회(검색·통계·렌더) → query 테스트 green
   - 4단계: 저장 경계 + 엔진 + 복사 → store·engine 테스트 green
4. risk tier: two-way door(로컬 전용·되돌리기 쉬움). 외부 부수효과 없음.
5. Human Gate: 없음(로컬·비식별). 실제 저장/배포 어댑터 붙일 때 승인 필요.
6. Rollback note: → `templates/rollback-note.md`

## Test Matrix (AC ↔ 테스트) — 전부 pass
| AC | 범주 | 유형 | 테스트 파일 | 실행 | 완료 |
| --- | --- | --- | --- | --- | --- |
| AC1 카드 이동 order·listId | 정상 | unit | `test/board.test.js` | `npm test` | pass |
| AC2 라벨/멤버 AND 필터 | 정상 | unit | `test/query.test.js` | `npm test` | pass |
| AC3 체크리스트 진행률 % | 정상 | unit | `test/card.test.js` | `npm test` | pass |
| AC4 overdue 판정 | 정상 | unit | `test/card·query.test.js` | `npm test` | pass |
| AC5 이동 인덱스 clamp | 경계 | unit | `test/board.test.js` | `npm test` | pass |
| AC6 항목 0개 진행률 0% | 경계 | unit | `test/card.test.js` | `npm test` | pass |
| AC7 보관 항목 기본 제외 | 경계 | unit | `test/board·query.test.js` | `npm test` | pass |
| AC8 부모없음·빈title·중복 no-op | 예외 | unit | `test/board.test.js` | `npm test` | pass |
| AC9 미정의 라벨·비멤버 배정 거부 | 예외 | unit | `test/card.test.js` | `npm test` | pass |
| AC10 store 실패 안전 폴백 | 예외 | unit | `test/store.test.js` | `npm test` | pass |
| AC11 카드 복사(코멘트 제외·새 id) | 정상 | unit | `test/engine.test.js` | `npm test` | pass |
| AC12 보드 복사 라벨 재매핑 | 정상 | unit | `test/engine.test.js` | `npm test` | pass |
| 금지 파일 불변 | 정책 | policy | — | `npm run policy-check` | pass |
