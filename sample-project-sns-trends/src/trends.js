// src/trends.js
// 유명 SNS 트렌드 분석 엔진 — 실습용(폴백 대안 프로젝트).
//
// 설계 결정(중요):
//   - 실제 SNS API 호출(검색)은 **주입 가능한 fetch**로 분리합니다. 네트워크·API 키·비결정성 때문에
//     테스트에서는 fake fetcher를 주입해 로컬에서 **결정론적으로** 검증합니다.
//   - 핵심 분석 로직(해시태그 추출·점수·랭킹)은 **순수(pure)·결정론** 함수로 둡니다.
//
// 게시물(post) 형태: { text: string, likes?: number, reposts?: number, createdAt?: ISOString|number }
//
// 트렌드 점수 규칙(고정):
//   태그 점수 = Σ over (그 태그를 포함한 게시물) [ (1 + engagement(post)) * recencyWeight(post, now) ]
//   engagement(post) = likes + reposts*2
//   recencyWeight    = 최근일수록 1, 오래될수록 감쇠(반감기 7일) — Day2-S4에서 test-first로 구현.

/** 텍스트에서 해시태그를 소문자로 추출한다(#영문/숫자/_/한글). 게시물 내 중복도 그대로 반환. */
export function extractHashtags(text) {
  const out = [];
  const re = /#([0-9A-Za-z_\uAC00-\uD7A3]+)/g;
  let m;
  while ((m = re.exec(String(text ?? ''))) !== null) out.push(m[1].toLowerCase());
  return out;
}

/** 한 게시물의 인게이지먼트 = likes + reposts*2 (reposts를 2배 가중). */
export function engagement(post) {
  const likes = Number(post?.likes) || 0;
  const reposts = Number(post?.reposts) || 0;
  return likes + reposts * 2;
}

/**
 * 최근성 가중(recency weight): 최근일수록 1에 가깝고 오래될수록 감쇠한다.
 *
 * now 기준 경과일수 d에 대해 **반감기 7일** 감쇠 `0.5 ** (d / 7)`.
 *   - createdAt(ISO 문자열 또는 ms)이 유효하지 않으면 1을 반환(감쇠 없음).
 *   - 미래/동시각(경과일 <= 0)도 1을 반환.
 */
export function recencyWeight(post, now = Date.now()) {
  const created = post?.createdAt;
  const t = typeof created === 'number' ? created : Date.parse(created);
  if (!Number.isFinite(t)) return 1; // createdAt 무효 → 감쇠 없음
  const elapsedDays = (now - t) / 86_400_000;
  if (elapsedDays <= 0) return 1; // 미래/동시각 → 감쇠 없음
  return 0.5 ** (elapsedDays / 7); // 반감기 7일
}

/**
 * 트렌드 랭킹: 게시물 목록 → 해시태그별 점수 내림차순 상위 topN.
 * @param {{now?:number, topN?:number, tagFilter?:(tag:string)=>boolean}} opts
 *   tagFilter: 태그를 포함할지 결정하는 술어(예: 한글 태그만). 미지정 시 모든 태그 포함.
 * @returns {{tag:string, score:number, count:number}[]}
 */
export function rankTrends(posts, { now = Date.now(), topN = 10, tagFilter = null } = {}) {
  if (!Array.isArray(posts)) return [];
  if (typeof topN !== 'number' || topN <= 0) return [];
  const map = new Map(); // tag -> { score, count }
  for (const post of posts) {
    const tags = new Set(extractHashtags(post?.text)); // 한 게시물 내 중복 태그는 1회만
    const weight = (1 + engagement(post)) * recencyWeight(post, now);
    for (const tag of tags) {
      if (typeof tagFilter === 'function' && !tagFilter(tag)) continue; // 필터 통과 태그만
      const cur = map.get(tag) || { score: 0, count: 0 };
      cur.score += weight;
      cur.count += 1;
      map.set(tag, cur);
    }
  }
  return [...map.entries()]
    .map(([tag, v]) => ({ tag, score: v.score, count: v.count }))
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, topN);
}

/** 태그가 한글(Hangul)을 포함하는지(한글 태그 여부). */
export function isHangulTag(tag) {
  return /[\uAC00-\uD7A3]/.test(String(tag ?? ''));
}

/**
 * 세그먼트(지역/연령대)별 트렌드 랭킹.
 * 게시물의 `region` 또는 `ageGroup` 값으로 그룹핑한 뒤 그룹마다 상위 트렌드를 뽑는다.
 * @param {any[]} posts
 * @param {'region'|'ageGroup'} dimension
 * @returns {Record<string, {tag:string, score:number, count:number}[]>} 세그먼트값 → 트렌드 배열
 */
export function rankTrendsBySegment(posts, dimension, { now = Date.now(), topN = 5, tagFilter = null } = {}) {
  if (!Array.isArray(posts)) return {};
  if (dimension !== 'region' && dimension !== 'ageGroup') return {};
  const groups = new Map(); // segmentValue -> post[]
  for (const post of posts) {
    const key = post?.[dimension];
    if (key == null || key === '') continue; // 세그먼트 값이 없는 게시물은 제외
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(post);
  }
  const out = {};
  for (const [key, group] of groups) {
    const ranked = rankTrends(group, { now, topN, tagFilter });
    if (ranked.length) out[key] = ranked;
  }
  return out;
}

/**
 * 최근 N일 이내(예: 이번 주 = 7일)의 게시물만 남긴다. createdAt이 없으면(시각 미상) 유지.
 * @param {any[]} posts
 * @param {number} days 유지할 최근 일수(>0)
 */
export function filterRecentDays(posts, days, now = Date.now()) {
  if (!Array.isArray(posts)) return [];
  if (!(days > 0)) return posts.slice();
  const cutoff = now - days * 86_400_000;
  return posts.filter((p) => {
    const c = p?.createdAt;
    const t = typeof c === 'number' ? c : Date.parse(c);
    return Number.isFinite(t) ? t >= cutoff : true;
  });
}

/** 텍스트에서 대략적인 언어를 추론한다(한글→'ko', 라틴 문자→'en', 그 외 null). */
export function detectLang(text) {
  const s = String(text ?? '');
  if (/[\uAC00-\uD7A3]/.test(s)) return 'ko';
  if (/[A-Za-z]/.test(s)) return 'en';
  return null;
}

/**
 * 지정 언어(예: ['ko','en'])의 게시물만 남긴다.
 *   - post.language가 있으면 그 값을 사용(정확), 없으면 텍스트로 추론.
 *   - 언어를 전혀 알 수 없으면(추론 null) 보수적으로 유지한다.
 * @param {any[]} posts
 * @param {string[]} langs 허용 언어 코드 목록
 */
export function filterLanguages(posts, langs, { detect = detectLang } = {}) {
  if (!Array.isArray(posts)) return [];
  if (!Array.isArray(langs) || langs.length === 0) return posts.slice();
  const allow = new Set(langs);
  return posts.filter((p) => {
    const lang = p?.language || detect(p?.text);
    return lang ? allow.has(lang) : true;
  });
}

/**
 * SNS 검색(수집): 주입된 `fetch`로 게시물을 가져온다. 실제 네트워크 대신 테스트는 fake fetcher를 주입.
 * @param {string} query
 * @param {{fetch?: (q:string)=>Promise<any[]>}} deps
 * @returns {Promise<any[]>} 게시물 배열(실패/비배열 → 빈 배열)
 */
export async function searchPosts(query, { fetch } = {}) {
  if (typeof fetch !== 'function') return [];
  try {
    const posts = await fetch(query);
    return Array.isArray(posts) ? posts : [];
  } catch {
    return [];
  }
}
