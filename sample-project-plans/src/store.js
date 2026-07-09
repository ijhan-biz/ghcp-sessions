// src/store.js
// 저장 경계(얇은 I/O) — 실제 DB/파일/클라우드 대신 **주입된 store 어댑터**로 상태를 로드/저장한다.
//
// 설계 결정(중요):
//   - 실제 영속화·클라우드 동기화·실시간(WebSocket) 협업은 **비목표(non-goal)** 다.
//     OS/네트워크 의존·비결정성 때문에, 테스트에서는 **fake store** 를 주입해 결정론적으로 검증한다.
//   - load 는 어떤 실패에도 **안전하게 초기 상태로 폴백**한다(앱이 죽지 않게).

import { initialState, isValidState } from './state.js';

/**
 * 주입된 store.load() 로 상태를 읽는다.
 * store 미주입/부적합 데이터/실패 → 초기 상태.
 * @returns {Promise<object>}
 */
export async function loadState({ store } = {}) {
  if (!store || typeof store.load !== 'function') return initialState();
  try {
    const data = await store.load();
    return isValidState(data) ? data : initialState();
  } catch {
    return initialState();
  }
}

/**
 * 주입된 store.save(state) 로 상태를 저장한다.
 * store 미주입/실패 → false(안전 처리). 성공 → true.
 * @returns {Promise<boolean>}
 */
export async function saveState(state, { store } = {}) {
  if (!store || typeof store.save !== 'function') return false;
  try {
    await store.save(state);
    return true;
  } catch {
    return false;
  }
}

/**
 * 교육/데모용 인메모리 store 팩토리(부수효과 없는 fake).
 * 실제 어댑터(파일/DB/localStorage)는 같은 { load, save } 모양으로 교체하면 된다.
 */
export function memoryStore(seed = null) {
  let saved = seed;
  return {
    async load() { return saved; },
    async save(state) { saved = state; },
    get snapshot() { return saved; },
  };
}
