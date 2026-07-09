// src/plans.js
// 배럴(진입점) — 순수 코어 + 엔진을 한 곳에서 노출한다.
//   import { createEngine, initialState, addCard, renderBoard, ... } from './plans.js'
//
// 두 가지 사용법:
//   1) 순수 코어: 상태를 직접 넘기는 함수형(테스트·재현에 유리, id/at 명시).
//   2) 엔진: createEngine 으로 id/시간/저장 경계를 주입하고 메서드 체이닝(앱에서 편함).

export * from './state.js';
export * from './board.js';
export * from './card.js';
export * from './query.js';
export * from './store.js';
export { createEngine, seedDemoBoard } from './engine.js';
