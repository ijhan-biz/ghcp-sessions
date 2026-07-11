// Self-paced checkpoint: baseline activity engine (sessionize TODO).
const ms = (t) => (typeof t === 'number' ? t : Date.parse(t));

export function isValidEvent(e) {
  const s = ms(e?.start), en = ms(e?.end);
  return typeof e?.app === 'string' && Number.isFinite(s) && Number.isFinite(en) && s < en;
}

export function durationByApp(events) {
  const out = {};
  if (!Array.isArray(events)) return out;
  for (const e of events) {
    if (!isValidEvent(e)) continue;
    out[e.app] = (out[e.app] || 0) + (ms(e.end) - ms(e.start));
  }
  return out;
}

export function categorize(app, rules = {}) {
  return rules[app] || 'other';
}

export function topApps(byApp, n = 5) {
  const arr = Object.entries(byApp).map(([app, value]) => ({ app, ms: value }));
  arr.sort((a, b) => b.ms - a.ms);
  return typeof n === 'number' && n > 0 ? arr.slice(0, n) : [];
}

export function sessionize(events, idleGapMs = 5 * 60 * 1000) {
  // TODO(Day2-S4)
  return [];
}

export async function collectEvents(range, { collector } = {}) {
  if (typeof collector !== 'function') return [];
  try {
    const events = await collector(range);
    return Array.isArray(events) ? events : [];
  } catch {
    return [];
  }
}