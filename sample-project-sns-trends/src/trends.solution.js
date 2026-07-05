// src/trends.solution.js
// 참고 정답 — recencyWeight(반감기 7일 감쇠) 구현 예시.
// (test 는 src/trends.js 를 임포트합니다. 이 파일은 막혔을 때 비교용입니다.)

export function recencyWeight(post, now = Date.now()) {
  const t = typeof post?.createdAt === 'number' ? post.createdAt : Date.parse(post?.createdAt);
  if (!Number.isFinite(t)) return 1;            // 시각 정보 없으면 감쇠 없음
  const days = Math.max(0, (now - t) / 86_400_000);
  return 0.5 ** (days / 7);                      // 반감기 7일
}

// 나머지 함수(extractHashtags/engagement/rankTrends/searchPosts)는 src/trends.js 와 동일합니다.
// rankTrends 는 위 recencyWeight 를 사용하면 "최근 게시물의 태그"가 더 높은 점수를 받습니다.
