// src/collect.js
// 수집 소스 선택 정책(순수 함수).
//   실데이터 소스(web/mastodon)가 있으면 검색 결과가 비어도 그 소스를 유지하고 샘플로 폴백하지 않는다.
//   → 태그 나열은 항상 "실제 검색 결과" 기반이며, 특정 태그를 샘플(가짜) 데이터로 채우지 않는다.
//   샘플은 실데이터 소스가 아예 없을 때(FORCE_SAMPLE·오프라인)만 사용한다.

/**
 * @param {{realSource: (string|null), realPosts?: any[], samplePosts?: any[]}} args
 * @returns {{posts: any[], source: string}}
 */
export function decideCollected({ realSource, realPosts = [], samplePosts = [] }) {
  if (realSource) return { posts: realPosts, source: realSource };
  return { posts: samplePosts, source: 'sample' };
}
