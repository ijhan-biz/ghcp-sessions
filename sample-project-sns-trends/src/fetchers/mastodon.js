// src/fetchers/mastodon.js
// 실제 SNS 데이터 수집 어댑터 — Mastodon 공개 타임라인(API 키·OAuth 불필요, 읽기 전용 공개 데이터).
//
// 가드레일 준수:
//   - 외부 npm 패키지 0 (Node 18+ 내장 fetch).
//   - 비밀키/토큰 없음(공개 엔드포인트). secret 미사용.
//   - 주입형 fetch로 분리 → 테스트는 fake fetch로 결정론 검증.
//
// 반환 fetcher 시그니처는 searchPosts가 기대하는 `(query) => Promise<post[]>`.

/** Mastodon status 배열을 post 배열로 매핑한다. 순수 함수(네트워크 없음). */
export function mapStatusesToPosts(data) {
  if (!Array.isArray(data)) return [];
  return data.map((s) => ({
    text: stripHtml(s?.content),
    likes: Number(s?.favourites_count) || 0,
    reposts: Number(s?.reblogs_count) || 0,
    createdAt: s?.created_at ?? new Date().toISOString(),
    language: s?.language ?? null,
  })).filter((p) => p.text);
}

/** Mastodon 콘텐츠(HTML)에서 텍스트만 추출한다(해시태그 텍스트는 보존). */
export function stripHtml(html) {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mastodon 실데이터 fetcher를 만든다(페이지네이션으로 다량 수집, 최대 limit건).
 *   - query 있으면: 해시태그 타임라인(/api/v1/timelines/tag/{tag}) — max_id 커서 페이지네이션
 *   - query 없으면: 트렌딩 게시물(/api/v1/trends/statuses) — offset 페이지네이션
 *     (공개 타임라인 /timelines/public 은 인증을 요구하므로 사용하지 않는다)
 *   - sinceDays 지정 시 그 창을 벗어나면 조기 중단(불필요한 페이지 요청 방지).
 * @param {{instance?:string, limit?:number, pageSize?:number, sinceDays?:number, fetch?:Function}} cfg
 */
export function createMastodonFetcher(cfg = {}) {
  const { instance = 'https://mastodon.social', limit = 3000, pageSize = 40, sinceDays = null, fetch = globalThis.fetch } = cfg;
  if (typeof fetch !== 'function') return null;

  const headers = { Accept: 'application/json', 'User-Agent': 'sns-trends-demo/1.0' };

  return async function mastodonFetch(query) {
    const tag = String(query ?? '').replace(/^#/, '').trim().split(/\s+/)[0];
    const base = String(instance).replace(/\/+$/, '');
    const cutoff = sinceDays > 0 ? Date.now() - sinceDays * 86_400_000 : null;
    const maxPages = Math.ceil(limit / pageSize) + 1;
    const posts = [];

    let maxId = null;   // 태그 타임라인용 커서
    let offset = 0;     // 트렌딩용 오프셋
    for (let page = 0; posts.length < limit && page < maxPages; page++) {
      const params = new URLSearchParams({ limit: String(pageSize) });
      let url;
      if (tag) {
        if (maxId) params.set('max_id', maxId);
        url = `${base}/api/v1/timelines/tag/${encodeURIComponent(tag.toLowerCase())}?${params.toString()}`;
      } else {
        if (offset) params.set('offset', String(offset));
        url = `${base}/api/v1/trends/statuses?${params.toString()}`;
      }

      const res = await fetch(url, { headers });
      if (!res || !res.ok) break;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;
      posts.push(...mapStatusesToPosts(data));

      const last = data[data.length - 1];
      const lastCreated = Date.parse(last?.created_at);
      if (data.length < pageSize) break; // 마지막 페이지
      if (cutoff && Number.isFinite(lastCreated) && lastCreated < cutoff) break; // 수집 창을 벗어남

      if (tag) {
        const nextId = last?.id ?? null;
        if (!nextId || nextId === maxId) break; // 커서 정체
        maxId = nextId;
      } else {
        offset += pageSize;
      }
    }
    return posts.slice(0, limit);
  };
}
