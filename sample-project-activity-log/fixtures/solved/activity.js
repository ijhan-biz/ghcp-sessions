// Self-paced checkpoint: solved activity engine.
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
  if (!Array.isArray(events)) return [];
  const valid = events
    .filter(isValidEvent)
    .map((event) => ({ start: ms(event.start), end: ms(event.end) }))
    .sort((a, b) => a.start - b.start);
  const out = [];
  for (const event of valid) {
    const current = out[out.length - 1];
    if (current && event.start - current.end <= idleGapMs) {
      current.end = Math.max(current.end, event.end);
      current.count += 1;
    } else {
      out.push({ start: event.start, end: event.end, count: 1 });
    }
  }
  return out;
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