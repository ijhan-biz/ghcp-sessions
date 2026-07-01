// src/curate.js
// 검색 결과 정리(큐레이션) 엔진 — 폴백 실습용(대안 도메인).
//
// 주의(설계 결정): 실제 웹 fetch/크롤링은 하지 않습니다.
//   네트워크·비결정성·API 키가 필요해 테스트가 불가능하기 때문입니다.
//   이 엔진은 "이미 수집된 검색 결과 목록"을 입력으로 받아
//   정규화·중복제거·랭킹·요약하는 순수(pure)·결정적 로직만 다룹니다.
//
// 결과 item 형태: { title: string, url: string, snippet?: string, score?: number }
//
// 현재 구현: rankResults / summarizeTop / dedupeByUrl(정상) 동작.
// Day2-S4 SDD test-first: normalizeUrl 이 비어 있어 "변형 URL"(끝 슬래시·utm·host 대소문자)
//   중복이 제거되지 않습니다. test/curate.test.js 의 { skip: true } 를 제거하고
//   normalizeUrl 을 구현하세요. 정답 비교: src/curate.solution.js

/**
 * URL을 비교용으로 정규화한다(중복 판정 키).
 * @param {string} url
 * @returns {string} 정규화된 URL
 */
export function normalizeUrl(url) {
  // TODO(Day2-S4 SDD): 아래를 구현하세요.
  //   - host 소문자화, 끝 슬래시 제거, fragment(#...) 제거
  //   - 트래킹 파라미터(utm_*, ref, fbclid) 제거, 남은 쿼리는 키 기준 정렬
  return url;
}

/**
 * 정규화된 URL 기준으로 중복을 제거한다(첫 등장 유지).
 */
export function dedupeByUrl(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const key = normalizeUrl(it.url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

/**
 * 점수 내림차순으로 정렬한다(동점이면 title에 query 포함을 우선). 입력을 변형하지 않음.
 */
export function rankResults(items, query = '') {
  const q = String(query).toLowerCase();
  return [...items].sort((a, b) => {
    const byScore = (b.score ?? 0) - (a.score ?? 0);
    if (byScore !== 0) return byScore;
    const am = a.title?.toLowerCase().includes(q) ? 1 : 0;
    const bm = b.title?.toLowerCase().includes(q) ? 1 : 0;
    return bm - am;
  });
}

/**
 * 상위 n개를 {title, url}로 요약한다. n<=0 → [], n>len → 전체.
 */
export function summarizeTop(items, n) {
  if (typeof n !== 'number' || n <= 0) return [];
  return items.slice(0, n).map(({ title, url }) => ({ title, url }));
}
