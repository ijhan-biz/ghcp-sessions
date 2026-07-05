// src/fetchers/webSearch.js
// 실제 웹 검색 수집 어댑터 — 주입형 fetch 경계를 지키면서 실제 검색 API로 게시물을 수집한다.
//
// 가드레일 준수:
//   - 외부 npm 패키지 0 (Node 18+ 내장 fetch 사용).
//   - API 키는 오직 env(process.env)로만 주입 — 리포지토리에 저장하지 않는다.
//   - 키/엔드포인트가 없으면 null을 반환 → 호출측이 샘플 fetcher로 폴백(기본은 외부 호출 없음).
//
// 반환 fetcher 시그니처는 searchPosts가 기대하는 `(query) => Promise<post[]>` 와 동일하다.

/** 검색 API 응답(provider별 형태)을 post 배열로 매핑한다. 순수 함수(네트워크 없음). */
export function mapResultsToPosts(data, now = Date.now()) {
  const results = data?.web?.results ?? data?.results ?? data?.value ?? [];
  if (!Array.isArray(results)) return [];
  return results.map((r) => {
    const title = r?.title ?? r?.name ?? '';
    const desc = r?.description ?? r?.snippet ?? r?.text ?? '';
    const when = parseWhen(r?.age ?? r?.page_age ?? r?.dateLastCrawled ?? r?.published);
    return {
      text: `${title} ${desc}`.trim(),
      likes: 0,
      reposts: 0,
      createdAt: when ?? new Date(now).toISOString(),
    };
  });
}

function parseWhen(v) {
  if (v == null) return null;
  const t = typeof v === 'number' ? v : Date.parse(v);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

/**
 * 실제 검색 fetcher를 만든다. 키/엔드포인트가 없으면 null(→ 폴백).
 * @param {{apiKey?:string, endpoint?:string, authHeader?:string, fetch?:Function}} cfg
 * @returns {((query:string)=>Promise<any[]>) | null}
 */
export function createWebSearchFetcher(cfg = {}) {
  const { apiKey, endpoint, authHeader = 'X-Subscription-Token', fetch = globalThis.fetch } = cfg;
  if (!apiKey || !endpoint || typeof fetch !== 'function') return null;

  return async function webFetch(query) {
    const url = new URL(endpoint);
    url.searchParams.set('q', String(query ?? ''));
    const res = await fetch(url.toString(), {
      headers: { [authHeader]: apiKey, Accept: 'application/json' },
    });
    if (!res || !res.ok) return [];
    const data = await res.json();
    return mapResultsToPosts(data);
  };
}
