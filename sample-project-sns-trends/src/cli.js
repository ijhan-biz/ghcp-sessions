#!/usr/bin/env node
// src/cli.js — 트렌드 엔진을 직접 실행해 보는 데모 CLI.
//
// 설계 경계 준수: 실제 SNS API/키/네트워크 없이 내장 fake fetcher(샘플 게시물)로 결정론 실행.
// 사용법:
//   node src/cli.js                 # 전체 샘플로 상위 트렌드
//   node src/cli.js "#ai"           # 검색어(부분일치)로 수집 후 랭킹
//   node src/cli.js "#tech" --topN=3
import { searchPosts, rankTrends, rankTrendsBySegment } from './trends.js';
import { createSampleFetcher } from './sampleData.js';
import { explainTrends } from './keywordDetails.js';

function parseArgs(argv) {
  const rest = argv.slice(2);
  const topNArg = rest.find((a) => a.startsWith('--topN='));
  const topN = topNArg ? Number(topNArg.split('=')[1]) : 5;
  const query = rest.find((a) => !a.startsWith('--')) ?? '';
  return { query, topN };
}

function printSegment(title, segment) {
  const entries = Object.entries(segment);
  if (entries.length === 0) return;
  console.log(`\n${title}`);
  for (const [key, list] of entries) {
    const top = list.slice(0, 3).map((t) => `#${t.tag}(${t.score.toFixed(1)})`).join(', ');
    console.log(`  ${key.padEnd(6)} ${top}`);
  }
}

async function main() {
  const { query, topN } = parseArgs(process.argv);

  // 실제 fetch 대신 내장 fake fetcher를 주입(쿼리 부분일치).
  const fakeFetch = createSampleFetcher();

  const posts = await searchPosts(query, { fetch: fakeFetch });
  const trends = rankTrends(posts, { topN });

  console.log(`검색어: "${query || '(전체)'}"  |  수집 ${posts.length}건  |  상위 ${topN}`);
  console.log('-'.repeat(40));
  if (trends.length === 0) {
    console.log('트렌드 없음');
    return;
  }
  console.log('순위  태그              점수     언급');
  trends.forEach((t, i) => {
    const rank = String(i + 1).padStart(2);
    const tag = ('#' + t.tag).padEnd(16);
    const score = t.score.toFixed(2).padStart(7);
    console.log(`${rank}   ${tag}${score}   ${t.count}`);
  });

  const details = explainTrends(posts, trends, { maxSamples: 2 });
  console.log('\n키워드별 주요 내용');
  trends.forEach((t) => {
    const d = details[t.tag];
    if (!d) return;
    console.log(`\n  #${t.tag}`);
    (d.explanation || []).forEach((line) => console.log(`    - ${line}`));
  });

  printSegment('지역별 주요 키워드', rankTrendsBySegment(posts, 'region', { topN: 3 }));
  printSegment('연령대별 주요 키워드', rankTrendsBySegment(posts, 'ageGroup', { topN: 3 }));
}

main();
