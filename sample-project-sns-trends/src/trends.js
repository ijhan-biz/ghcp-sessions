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
 * TODO(Day2-S4 SDD): now 기준 경과일수 d에 대해 **반감기 7일** 감쇠 `0.5 ** (d / 7)` 로 구현하세요.
 *   - createdAt(ISO 문자열 또는 ms)이 유효하지 않으면 1을 반환(감쇠 없음).
 *   현재는 항상 1(감쇠 없음)이라 오래된 게시물도 동일 가중입니다.
 *   test/trends.test.js 의 `{ skip: true }` 2곳을 제거하고 아래를 구현하세요. 정답: src/trends.solution.js
 */
export function recencyWeight(post, now = Date.now()) {
  // TODO(Day2-S4): 반감기 7일 감쇠를 구현하세요.
  return 1;
}

/**
 * 트렌드 랭킹: 게시물 목록 → 해시태그별 점수 내림차순 상위 topN.
 * @returns {{tag:string, score:number, count:number}[]}
 */
export function rankTrends(posts, { now = Date.now(), topN = 10 } = {}) {
  if (!Array.isArray(posts)) return [];
  if (typeof topN !== 'number' || topN <= 0) return [];
  const map = new Map(); // tag -> { score, count }
  for (const post of posts) {
    const tags = new Set(extractHashtags(post?.text)); // 한 게시물 내 중복 태그는 1회만
    const weight = (1 + engagement(post)) * recencyWeight(post, now);
    for (const tag of tags) {
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
