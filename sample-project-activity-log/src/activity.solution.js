// src/activity.solution.js
// 참고 정답 — sessionize(유휴 간격 기준 집중 세션 분리) 구현 예.
// (test 는 src/activity.js 를 임포트합니다. 이 파일은 막혔을 때 비교용입니다.)

export function sessionize(events, idleGapMs = 5 * 60 * 1000) {
  const ms = (t) => (typeof t === 'number' ? t : Date.parse(t));
  if (!Array.isArray(events)) return [];
  const valid = events
    .filter((e) =>
      typeof e?.app === 'string'
      && Number.isFinite(ms(e?.start)) && Number.isFinite(ms(e?.end))
      && ms(e.start) < ms(e.end))
    .map((e) => ({ start: ms(e.start), end: ms(e.end) }))
    .sort((a, b) => a.start - b.start);

  const out = [];
  for (const e of valid) {
    const cur = out[out.length - 1];
    if (cur && e.start - cur.end <= idleGapMs) {  // 간격이 idleGap 이하 → 같은 세션
      cur.end = Math.max(cur.end, e.end);
      cur.count += 1;
    } else {                                      // 초과 → 새 집중 세션
      out.push({ start: e.start, end: e.end, count: 1 });
    }
  }
  return out;
}
