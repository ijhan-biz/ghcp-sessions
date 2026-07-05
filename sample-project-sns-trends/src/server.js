#!/usr/bin/env node
// src/server.js — 트렌드 엔진을 브라우저 화면에서 보는 로컬 데모 서버(의존성 없음, Node 내장 http).
//
// 데이터 소스 우선순위: (1) env 웹검색(옵트인) → (2) Mastodon 공개 타임라인(실데이터, 키 불필요)
//                       → (3) 샘플 폴백(오프라인/실패 시). 분석 로직은 순수 함수 유지.
// 사용법:  node src/server.js      →  http://127.0.0.1:3000
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { searchPosts, rankTrends, rankTrendsBySegment, filterRecentDays, filterLanguages, isHangulTag } from './trends.js';
import { createWebSearchFetcher } from './fetchers/webSearch.js';
import { createMastodonFetcher } from './fetchers/mastodon.js';
import { createBlueskyFetcher } from './fetchers/bluesky.js';
import { generateInsight } from './insight.js';
import { createSampleFetcher } from './sampleData.js';
import { explainTrends } from './keywordDetails.js';
import { createTTLCache } from './cache.js';
import { decideCollected } from './collect.js';
import { filterSafe } from './safeFilter.js';
import { createSnapshotFetcher } from './fetchers/snapshot.js';

const here = dirname(fileURLToPath(import.meta.url));
const INDEX_HTML = join(here, '..', 'public', 'index.html');
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT) || 3000;
const WINDOW_DAYS = Number(process.env.WINDOW_DAYS) || 90; // 수집 창 = 최근 3개월(90일)
const MAX_COLLECT = Number(process.env.MAX_COLLECT) || 3000; // 실데이터 최대 수집량
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS) || 300_000; // 수집 결과 캐시 TTL(기본 5분)
const LANGS = (process.env.LANGS || 'ko').split(',').map((s) => s.trim()).filter(Boolean); // 수집 언어(기본 한국어)
const TAG_SCRIPT = process.env.TAG_SCRIPT || 'hangul'; // 태그 종류: 'hangul'(한글 태그만) | 'any'(전체)
const tagFilter = TAG_SCRIPT === 'hangul' ? isHangulTag : null;

// 수집 창을 사람친화적으로 표기(28일 이상은 개월, 그 이하는 일).
function windowLabel(days) {
  return days >= 28 ? `최근 ${Math.round(days / 30)}개월` : `최근 ${days}일`;
}

const sampleFetch = createSampleFetcher();

// 실제 웹 검색 fetcher: env(WEB_SEARCH_API_KEY·WEB_SEARCH_ENDPOINT)가 있을 때만 활성화(옵트인).
const webFetch = createWebSearchFetcher({
  apiKey: process.env.WEB_SEARCH_API_KEY,
  endpoint: process.env.WEB_SEARCH_ENDPOINT,
  authHeader: process.env.WEB_SEARCH_AUTH_HEADER || 'X-Subscription-Token',
});

// 실제 SNS 데이터: Mastodon 공개 타임라인(키 불필요). FORCE_SAMPLE=1 이면 비활성화(오프라인 데모).
const mastodonFetch = process.env.FORCE_SAMPLE
  ? null
  : createMastodonFetcher({
      instance: process.env.MASTODON_INSTANCE || 'https://mastodon.social',
      limit: MAX_COLLECT,
      sinceDays: WINDOW_DAYS,
    });

// 실제 SNS 데이터: Bluesky 공개 검색 API(키 불필요). 키워드 검색용.
const blueskyFetch = process.env.FORCE_SAMPLE
  ? null
  : createBlueskyFetcher({ limit: MAX_COLLECT, pageSize: 100, sinceDays: WINDOW_DAYS });

// 기본 실데이터 소스(키워드 검색). 'bluesky' | 'mastodon'. 웹검색 env가 있으면 그게 우선.
const SOURCE = (process.env.SOURCE || 'bluesky').toLowerCase();

// 스냅샷(오프라인) 소스: USE_SNAPSHOT=1 또는 SOURCE=snapshot 이면 루트 snapshot.json에서 서빙(네트워크 불필요).
const SNAPSHOT_FILE = join(here, '..', 'snapshot.json');
const useSnapshot = process.env.USE_SNAPSHOT === '1' || SOURCE === 'snapshot';
const snapshotFetch = useSnapshot ? createSnapshotFetcher({ file: SNAPSHOT_FILE }) : null;

// 전체(빈 검색어) 개요용 안전 주제어. 파이어호스(lang:ko)는 성인·스팸이 많아 쓰지 않고, 안전 주제어를 모은다.
const SEED_TOPICS = (process.env.SEED_TOPICS || '뉴스,날씨,경제,스포츠,게임,음악,영화,여행,책,요리')
  .split(',').map((s) => s.trim()).filter(Boolean);
// 개요 수집용 소형 Bluesky fetcher(주제어마다 한 페이지).
const overviewFetcher = process.env.FORCE_SAMPLE ? null : createBlueskyFetcher({ limit: 60, pageSize: 60, sinceDays: WINDOW_DAYS });

// 전체 개요: 안전 주제어들을 검색해 합치고 텍스트로 중복 제거.
async function collectOverview() {
  if (!overviewFetcher) return [];
  const seen = new Set();
  const all = [];
  for (const seed of SEED_TOPICS) {
    let posts = [];
    try { posts = await overviewFetcher(seed); } catch { posts = []; }
    for (const p of posts) {
      if (seen.has(p.text)) continue;
      seen.add(p.text);
      all.push(p);
    }
  }
  return all;
}

// 실데이터 소스가 있으면 결과가 비어도 샘플로 폴백하지 않는다(태그 나열은 실제 검색 결과 기반).
// 수집 후 최근 WINDOW_DAYS일·지정 언어만 남기고, 성인·스팸을 안전 필터로 제거한다.
async function collectPosts(q) {
  const query = String(q ?? '').trim();
  // 스냅샷 모드: 저장된 데이터만 사용(네트워크 없음). 고정 스냅샷이므로 최근성 필터는 적용하지 않는다.
  if (snapshotFetch) {
    const raw = await searchPosts(query, { fetch: snapshotFetch });
    return decideCollected({ realSource: 'snapshot', realPosts: filterSafe(filterLanguages(raw, LANGS)) });
  }
  if (webFetch) {
    const raw = await searchPosts(query, { fetch: webFetch });
    return decideCollected({ realSource: 'web', realPosts: pipeline(raw) });
  }
  if (SOURCE === 'mastodon') {
    const raw = await searchPosts(query, { fetch: mastodonFetch });
    return decideCollected({ realSource: mastodonFetch ? 'mastodon' : null, realPosts: mastodonFetch ? pipeline(raw) : [] });
  }
  // 기본 bluesky: 전체는 안전 주제어 개요, 키워드는 검색
  if (blueskyFetch) {
    const raw = query === '' ? await collectOverview() : await searchPosts(query, { fetch: blueskyFetch });
    return decideCollected({ realSource: 'bluesky', realPosts: pipeline(raw) });
  }
  // 실소스 없음(FORCE_SAMPLE/오프라인) → 샘플
  const sample = await searchPosts(query, { fetch: sampleFetch });
  return decideCollected({ realSource: null, samplePosts: pipeline(sample) });
}

// 수집 후 공통 정제: 최근 창 → 언어 → 안전 필터.
function pipeline(raw) {
  return filterSafe(filterLanguages(filterRecentDays(raw, WINDOW_DAYS), LANGS));
}

// 느린 실데이터 수집을 TTL 동안 캐시해 동일 쿼리 재요청 시 즉시 응답한다.
const collectCache = createTTLCache({ ttlMs: CACHE_TTL_MS });
async function collectPostsCached(q) {
  const key = `q:${q}`;
  const hit = collectCache.get(key);
  if (hit) return { ...hit, cached: true };
  const fresh = await collectPosts(q);
  collectCache.set(key, fresh);
  return { ...fresh, cached: false };
}

// 인사이트 provider: env 토큰(GITHUB_TOKEN)이 있을 때만 GitHub Copilot(GitHub Models) LLM, 없으면 로컬 결정론 요약.
const insightDeps = {
  token: process.env.GITHUB_TOKEN || process.env.INSIGHT_TOKEN,
  endpoint: process.env.INSIGHT_ENDPOINT || 'https://models.inference.ai.azure.com/chat/completions',
  model: process.env.INSIGHT_MODEL || 'gpt-4o-mini',
};

async function handleTrends(url, res) {
  const q = url.searchParams.get('q') ?? '';
  const topN = Number(url.searchParams.get('topN')) || 5;
  const { posts, source, cached } = await collectPostsCached(q);
  const trends = rankTrends(posts, { topN, tagFilter });
  const details = explainTrends(posts, trends, { maxSamples: 2 });
  const byRegion = rankTrendsBySegment(posts, 'region', { topN: 3, tagFilter });
  const byAge = rankTrendsBySegment(posts, 'ageGroup', { topN: 3, tagFilter });
  const insight = await generateInsight(q, trends, posts, { ...insightDeps, segments: { byRegion, byAge } });
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ query: q, source, cached, windowDays: WINDOW_DAYS, windowLabel: windowLabel(WINDOW_DAYS), langs: LANGS, tagScript: TAG_SCRIPT, collected: posts.length, topN, trends, details, byRegion, byAge, insight }));
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/api/trends') return await handleTrends(url, res);
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = await readFile(INDEX_HTML);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server Error');
  }
});

server.listen(PORT, HOST, () => {
  const primary = process.env.FORCE_SAMPLE ? '내장 샘플'
    : useSnapshot ? '스냅샷(snapshot.json, 오프라인·네트워크 불필요)'
    : webFetch ? '실시간 웹 검색'
    : SOURCE === 'mastodon' ? `실시간 Mastodon(${process.env.MASTODON_INSTANCE || 'mastodon.social'})`
    : '실시간 Bluesky(api.bsky.app) · 전체는 안전 주제어 개요';
  console.log(`트렌드 화면: http://${HOST}:${PORT}  (종료: Ctrl+C)`);
  console.log(`데이터 소스: ${primary}${process.env.FORCE_SAMPLE ? '' : ' · 키 불필요, 실데이터 전용'}`);
  console.log(`수집 범위: ${windowLabel(WINDOW_DAYS)} · 최대 ${MAX_COLLECT}건 · 언어 ${LANGS.join('/')}${TAG_SCRIPT === 'hangul' ? ' · 한글 태그만' : ''}`);
  console.log(`캐시: 동일 쿼리 ${Math.round(CACHE_TTL_MS / 1000)}초 재사용`);
  console.log(`인사이트: ${insightDeps.token ? 'GitHub Copilot(LLM)' : '로컬 요약(토큰 미설정)'}`);
});
