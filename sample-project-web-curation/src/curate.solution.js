// src/curate.solution.js
// 참고용 정답 — Day2-S4 SDD 실습을 직접 해본 뒤 비교용으로만 보세요.
// (테스트는 curate.js 를 대상으로 합니다. 이 파일은 import 되지 않습니다.)

const TRACKING = new Set(['ref', 'fbclid']);

export function normalizeUrl(url) {
  const u = new URL(url);
  const host = u.hostname.toLowerCase();
  const path = u.pathname.replace(/\/+$/, '') || '/'; // 끝 슬래시 제거(루트는 유지)
  const params = [...u.searchParams.entries()]
    .filter(([k]) => !/^utm_/i.test(k) && !TRACKING.has(k))
    .sort(([a], [b]) => a.localeCompare(b));
  const qs = params.length ? '?' + params.map(([k, v]) => `${k}=${v}`).join('&') : '';
  return `${u.protocol}//${host}${path}${qs}`; // fragment 자동 제외
}

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

export function summarizeTop(items, n) {
  if (typeof n !== 'number' || n <= 0) return [];
  return items.slice(0, n).map(({ title, url }) => ({ title, url }));
}
