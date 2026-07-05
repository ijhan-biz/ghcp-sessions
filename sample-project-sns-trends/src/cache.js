// src/cache.js
// 간단한 TTL(Time-To-Live) 인메모리 캐시 — 순수·결정론(시각 주입 가능).
//   느린 실데이터 수집 결과를 짧게 캐시해 동일 쿼리 재요청 시 재수집을 건너뛴다.

/**
 * @param {{ttlMs?:number, now?:()=>number}} opts
 *   ttlMs: 항목 유효 시간(ms). now: 현재 시각 함수(테스트 주입용).
 */
export function createTTLCache({ ttlMs = 300_000, now = () => Date.now() } = {}) {
  const store = new Map(); // key -> { value, at }

  return {
    /** 유효한 값이면 반환, 없거나 만료면 undefined(만료 항목은 제거). */
    get(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (now() - entry.at > ttlMs) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    /** 값을 저장하고 시각을 갱신한다. */
    set(key, value) {
      store.set(key, { value, at: now() });
      return value;
    },
    /** 특정 키 무효화. */
    delete(key) {
      return store.delete(key);
    },
    /** 전체 비우기. */
    clear() {
      store.clear();
    },
    get size() {
      return store.size;
    },
  };
}
