// src/fetchers/bluesky.js
// 실제 SNS 데이터 수집 어댑터 — Bluesky 공개 검색 API(app.bsky.feed.searchPosts).
//
// 가드레일 준수:
//   - 외부 npm 패키지 0 (Node 18+ 내장 fetch).
//   - 공개 읽기 엔드포인트(키·OAuth 불필요). 스크래핑 아님(공식 공개 API).
//   - 주입형 fetch로 분리 → 테스트는 fake fetch로 결정론 검증.
//
// 반환 fetcher 시그니처는 searchPosts가 기대하는 `(query) => Promise<post[]>`.

/** Bluesky searchPosts 응답을 post 배열로 매핑한다. 순수 함수(네트워크 없음). */
export function mapBlueskyPosts(data) {
  const list = data?.posts;
  if (!Array.isArray(list)) return [];
  return list.map((p) => ({
    text: String(p?.record?.text ?? '').trim(),
    likes: Number(p?.likeCount) || 0,
    reposts: Number(p?.repostCount) || 0,
    createdAt: p?.record?.createdAt ?? p?.indexedAt ?? new Date().toISOString(),
    language: (Array.isArray(p?.record?.langs) ? p.record.langs[0] : null) ?? null,
  })).filter((p) => p.text);
}

/**
 * Bluesky 실데이터 fetcher를 만든다(cursor 페이지네이션, 최대 limit건).
 *   - 공개 검색 API는 검색어(q)가 필요하다. q가 비면 빈 배열(호출 안 함).
 *   - sinceDays 지정 시 결과가 그 창을 벗어나면 조기 중단.
 * @param {{service?:string, limit?:number, pageSize?:number, sinceDays?:number, langs?:string[], fetch?:Function}} cfg
 */
export function createBlueskyFetcher(cfg = {}) {
  const {
    service = 'https://api.bsky.app', limit = 3000, pageSize = 100,
    sinceDays = null, sort = 'latest', fetch = globalThis.fetch,
  } = cfg;
  if (typeof fetch !== 'function') return null;

  const headers = { Accept: 'application/json', 'User-Agent': 'sns-trends-demo/1.0' };

  return async function blueskyFetch(query) {
    const q = String(query ?? '').trim();
    if (!q) return []; // 공개 검색 API는 검색어 필요
    const base = String(service).replace(/\/+$/, '');
    const cutoff = sinceDays > 0 ? Date.now() - sinceDays * 86_400_000 : null;
    const maxPages = Math.ceil(limit / pageSize) + 1;

    const posts = [];
    let cursor = null;
    for (let page = 0; posts.length < limit && page < maxPages; page++) {
      // 주의: `lang` 파라미터는 Bluesky에서 sort=latest를 무력화해 오래된 글을 반환하므로 쓰지 않는다.
      //       언어 필터는 서버측 filterLanguages(post.language)로 처리한다.
      const params = new URLSearchParams({ q, limit: String(pageSize), sort });
      if (cursor) params.set('cursor', cursor);
      const res = await fetch(`${base}/xrpc/app.bsky.feed.searchPosts?${params.toString()}`, { headers });
      if (!res || !res.ok) break;
      const data = await res.json();
      const mapped = mapBlueskyPosts(data);
      if (mapped.length === 0) break;
      posts.push(...mapped);

      cursor = data?.cursor ?? null;
      if (!cursor) break; // 마지막 페이지
      const lastCreated = Date.parse(mapped[mapped.length - 1]?.createdAt);
      if (cutoff && Number.isFinite(lastCreated) && lastCreated < cutoff) break; // 수집 창을 벗어남
    }
    return posts.slice(0, limit);
  };
}
