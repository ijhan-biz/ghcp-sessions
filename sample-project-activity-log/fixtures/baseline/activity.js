// src/activity.js
// 개인 활동 로그 분석 엔진 — 전원 공통 self-paced 실습용 순수 로직.
//
// 설계 결정(중요):
//   - 실제 OS 프로세스·브라우저 기록 수집은 **주입 가능한 collector**로 분리합니다.
//     OS 의존·프라이버시·비결정성 때문에, 테스트에서는 fake collector를 주입해
//     로컬에서 **결정론적으로** 검증합니다.
//   - 분석 로직(집계·세션화·요약)은 **순수(pure)·결정론** 함수로 둡니다.
//   - 창 제목/URL 원문은 다루지 않고 **앱/카테고리 단위로만**(비식별) 분석합니다.
//
// 활동 이벤트 형태: { app: string, start: ISOString|ms, end: ISOString|ms }  (end > start)
//
// "이미 수집된 오늘의 활동 이벤트"를 받아 → 앱별 사용시간 / 카테고리 / 상위 앱 /
//   유휴로 끊긴 **집중 세션**을 계산합니다.

const ms = (t) => (typeof t === 'number' ? t : Date.parse(t));

/** 이벤트 유효성: app 이 문자열이고 start < end 인 유효 시각. */
export function isValidEvent(e) {
  const s = ms(e?.start), en = ms(e?.end);
  return typeof e?.app === 'string' && Number.isFinite(s) && Number.isFinite(en) && s < en;
}

/** 앱별 총 사용시간(ms). 유효하지 않은 이벤트는 건너뜀. events가 배열 아니면 빈 객체. */
export function durationByApp(events) {
  const out = {};
  if (!Array.isArray(events)) return out;
  for (const e of events) {
    if (!isValidEvent(e)) continue;
    out[e.app] = (out[e.app] || 0) + (ms(e.end) - ms(e.start));
  }
  return out;
}

/** 앱 → 카테고리. rules에 없으면 'other'. (예: {vscode:'work', slack:'comm'}) */
export function categorize(app, rules = {}) {
  return rules[app] || 'other';
}

/** {app: ms} → 상위 n개 [{app, ms}] 내림차순. n<=0 또는 숫자 아님 → []. */
export function topApps(byApp, n = 5) {
  const arr = Object.entries(byApp).map(([app, v]) => ({ app, ms: v }));
  arr.sort((a, b) => b.ms - a.ms);
  return typeof n === 'number' && n > 0 ? arr.slice(0, n) : [];
}

/**
 * 집중 세션 분리: 시간순 이벤트를 이어 붙이되, **유휴 간격이 idleGapMs를 초과**하면 새 세션.
 *
 * TODO(Day2-S4 SDD): 아래를 구현하세요.
 *   1) events 를 유효한 것만 남기고 start 기준 오름차순 정렬.
 *   2) 직전 세션 end 와 다음 이벤트 start 의 간격(gap)이
 *      - idleGapMs 이하면 같은 세션(end 를 max 로 확장, count += 1),
 *      - 초과면 새 세션 시작.
 *   3) 반환: [{ start, end, count }]  (count = 세션에 포함된 이벤트 수)
 *   현재는 빈 배열(미구현)이라 "유휴로 끊긴 집중 블록"이 계산되지 않습니다.
 *   test/activity.test.js 의 { skip: true } 2곳을 제거하고 직접 구현하세요.
 *   마지막 수단은 npm run lab -- recover d2-s4-green이며 FALLBACK으로 기록됩니다.
 */
export function sessionize(events, idleGapMs = 5 * 60 * 1000) {
  // TODO(Day2-S4)
  return [];
}

/**
 * 수집 경계(얇은 I/O): 주입된 collector로 활동 이벤트를 가져온다.
 * 실제 OS/브라우저 접근 대신 테스트는 fake collector를 주입.
 * @returns {Promise<Array>} 이벤트 배열(실패/비배열 → 빈 배열)
 */
export async function collectEvents(range, { collector } = {}) {
  if (typeof collector !== 'function') return [];
  try {
    const evs = await collector(range);
    return Array.isArray(evs) ? evs : [];
  } catch {
    return [];
  }
}