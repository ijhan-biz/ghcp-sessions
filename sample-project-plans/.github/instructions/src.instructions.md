---
applyTo: "src/**/*.js"
---

# src 편집 규칙 (Plans 코어)

- 이 폴더의 `board.js`·`card.js`·`query.js` 는 **순수 함수**다. 상태를 변형하지 말고 새 객체를 반환한다.
- 부수효과(id·시간·저장)는 여기 넣지 않는다 → `engine.js`(주입) / `store.js`(경계)로.
- 잘못된 입력은 예외를 던지기보다 **no-op(원본 state 반환)** 으로 안전 처리한다. 배정류는 멱등.
- 새/변경 함수는 `plans.js` 배럴에 반영하고, 대응 테스트(`test/*.test.js`)를 정상·예외·경계로 추가한다.
- 외부 패키지 import 금지(Node 18+ 내장만).
