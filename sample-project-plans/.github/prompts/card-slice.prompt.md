---
mode: agent
description: Plans 엔진에 카드 기능 slice 하나를 test-first 로 추가한다
---

# /card-slice — 카드 기능 slice 추가 (test-first)

입력으로 받은 slice 설명을 이 프로젝트 규칙대로 구현하세요.

1. slice 를 한 문장으로 요약하고 AC 를 **정상·예외·경계**로 나눈다.
2. `test/card.test.js`(또는 알맞은 area 테스트)에 **실패 테스트**를 먼저 추가한다(RED).
3. `src/card.js` 에 최소 구현을 추가한다 — 순수 함수 유지, 상태 변형 금지, 잘못된 입력은 no-op.
4. `src/plans.js` 배럴 export 와 `src/engine.js` 편의 메서드를 필요 시 연결한다.
5. `npm test` → green, `npm run gate` → 통과. 결과를 변경 요약 → 코드 → 테스트 순으로 보고한다.

제약: 외부 패키지 금지, `.env`·`prod/*`·`secrets/*` 변경 금지, 기존 시그니처 유지.
