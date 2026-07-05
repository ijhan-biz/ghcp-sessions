// src/fetchers/snapshot.js
// 스냅샷(오프라인) 수집 어댑터 — 저장된 snapshot.json에서 게시물을 읽어 검색어로 필터한다.
//   네트워크 없이 독립적으로 동일 결과를 재현하기 위한 소스.
//   - 빈 검색어 → 전체, 키워드 → 텍스트 부분일치(대소문자 무시, 선행 # 제거).
import { readFileSync, existsSync } from 'node:fs';

/** snapshot.json을 읽어 { savedAt, posts, ... } 를 반환한다(없거나 손상 시 null). */
export function loadSnapshot(file) {
  if (!file || !existsSync(file)) return null;
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    return Array.isArray(data?.posts) ? data : null;
  } catch {
    return null;
  }
}

/**
 * 스냅샷 fetcher를 만든다. `posts`를 직접 주입하거나 `file`에서 로드한다.
 * @param {{file?:string, posts?:any[]}} cfg
 * @returns {(query:string)=>Promise<any[]>}
 */
export function createSnapshotFetcher(cfg = {}) {
  const { file = null } = cfg;
  let cache = Array.isArray(cfg.posts) ? cfg.posts : null;

  function all() {
    if (cache) return cache;
    const snap = loadSnapshot(file);
    cache = snap ? snap.posts : [];
    return cache;
  }

  return async function snapshotFetch(query) {
    const q = String(query ?? '').replace(/^#/, '').trim().toLowerCase();
    const list = all();
    if (!q) return list.slice();
    return list.filter((p) => String(p?.text ?? '').toLowerCase().includes(q));
  };
}
