#!/usr/bin/env node
// scripts/save-snapshot.mjs
// 현재 실데이터(Bluesky 안전 주제어)를 수집해 루트 snapshot.json 으로 저장한다.
// 이후 `USE_SNAPSHOT=1 npm run serve` 로 네트워크 없이 동일 데이터를 재현할 수 있다.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { searchPosts, filterRecentDays, filterLanguages } from '../src/trends.js';
import { createBlueskyFetcher } from '../src/fetchers/bluesky.js';
import { filterSafe } from '../src/safeFilter.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WINDOW_DAYS = Number(process.env.WINDOW_DAYS) || 90;
const LANGS = (process.env.LANGS || 'ko').split(',').map((s) => s.trim()).filter(Boolean);
const SEED_TOPICS = (process.env.SEED_TOPICS || '뉴스,날씨,경제,스포츠,게임,음악,영화,여행,책,요리')
  .split(',').map((s) => s.trim()).filter(Boolean);

const fetcher = createBlueskyFetcher({ limit: 100, pageSize: 100, sinceDays: WINDOW_DAYS });
const seen = new Set();
const posts = [];
for (const seed of SEED_TOPICS) {
  let got = [];
  try { got = await searchPosts(seed, { fetch: fetcher }); } catch { got = []; }
  for (const p of got) {
    if (!seen.has(p.text)) { seen.add(p.text); posts.push(p); }
  }
  console.log(`  수집 "${seed}": +${got.length} (누적 ${posts.length})`);
}

const clean = filterSafe(filterLanguages(filterRecentDays(posts, WINDOW_DAYS), LANGS));
const out = {
  savedAt: new Date().toISOString(),
  source: 'bluesky',
  windowDays: WINDOW_DAYS,
  langs: LANGS,
  seedTopics: SEED_TOPICS,
  count: clean.length,
  posts: clean,
};
const file = join(root, 'snapshot.json');
writeFileSync(file, JSON.stringify(out, null, 2), 'utf8');
console.log(`\n✓ snapshot.json 저장 완료: ${clean.length}건 → ${file}`);
console.log('  실행: USE_SNAPSHOT=1 로 서버를 켜면 네트워크 없이 이 데이터를 재현합니다.');
