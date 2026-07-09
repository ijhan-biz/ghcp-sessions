# Plans 팀 공통 지침 (copilot-instructions)

이 워크스페이스(`sample-project-plans`)의 모든 Copilot 요청에 항상 적용되는 가드레일입니다.

## 도메인 규칙
- `src/board.js`·`src/card.js`·`src/query.js` 는 **순수 함수**다: `(state, args) => newState`.
  입력 상태를 **변형(mutation)하지 말 것** — 항상 새 객체를 반환한다.
- id 생성·현재 시각·저장 같은 **부수효과는 코어에 넣지 말 것**. `src/engine.js`(주입) / `src/store.js`(경계)로만.
- 상태는 정규화(`boards/lists/cards` 평면 맵 + order 배열). 이동/재정렬은 order 배열 splice.
- 잘못된 입력(부모 없음·빈 필수값·중복 id·없는 대상)은 **no-op**(원본 state 반환). 배정류는 멱등.

## 품질·안전
- 외부 패키지 추가 금지(Node 18+ 내장만). 새 기능은 **test-first**(정상·예외·경계).
- `.env`·`prod/*`·`secrets/*` 는 **변경 금지**(policy-check 감지). secret/키/고객정보 금지(비식별 유지).
- 완료 선언 전 `npm run gate`(lint + test + policy-check) 통과. gate 미통과로 "완료" 금지.

## 시그니처·문서
- 기존 export 시그니처를 임의로 바꾸지 말 것. 바꾸면 `src/plans.js`(배럴)와 테스트를 함께 갱신.
- 변경 시 관련 `test/*.test.js` 를 같이 수정하고, 필요하면 `README.md`/`FEATURE-SPEC.md` 를 갱신.
