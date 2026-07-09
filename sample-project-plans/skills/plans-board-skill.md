# Plans 도메인 Skill — 카드 slice 추가 (Custom Skill 예시 · Day2-S6)

## 목적
Plans 칸반 엔진에 **새 기능 slice 1개**를 이 프로젝트의 규칙대로 test-first 로 추가한다.
(도메인 특화 Custom Skill 의 예시 — 재사용 가능한 "나만의 솔루션".)

## 이 코드베이스의 불변 규칙 (지켜야 함)
- **순수 코어 유지**: `src/board.js`·`src/card.js`·`src/query.js` 의 함수는 `(state, args) => newState`
  형태의 순수 함수다. 입력 상태를 **변형하지 말고** 새 객체를 반환한다.
- **부수효과 금지(코어)**: id 생성·현재 시각·저장은 코어에 넣지 않는다. 필요하면 `src/engine.js`(주입)로 올린다.
- **정규화 상태**: `boards/lists/cards` 평면 맵 + order 배열. 이동/재정렬은 order splice 로.
- **안전 처리**: 부모 없음·빈 필수값·중복 id·없는 대상 → **no-op(원본 state 반환)**. 배정류는 멱등.
- **외부 패키지 추가 금지**. Node 18+ 내장만 사용.

## 절차 (test-first)
1. slice 를 한 문장으로 정의하고 AC 를 **정상·예외·경계**로 나눈다.
2. `test/<area>.test.js` 에 **실패하는 테스트**를 먼저 추가한다(RED).
3. 해당 코어 파일에 최소 구현을 추가하고, 필요하면 `src/engine.js` 에 편의 메서드/복사 합성을 연결한다.
4. `src/plans.js`(배럴)에서 export 되는지 확인한다.
5. `npm test` → green, `npm run gate` → 통과.

## 출력
- 실패 테스트 diff → 최소 구현 diff → `npm test`/`npm run gate` 결과 → (선택) `npm run demo` 반영.

## 금지
- 순수 코어에 부수효과 주입 · 상태 변형(mutation) · 외부 패키지 · blocked 파일(.env·prod/·secrets/) 변경.
