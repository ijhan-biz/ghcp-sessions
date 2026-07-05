// src/safeFilter.js
// 성인·스팸 콘텐츠 안전 필터(순수 함수). 공개 SNS 파이어호스에는 성인/스팸이 섞이므로
// 명백한 차단어를 포함한 게시물을 제외해 트렌드 목록을 안전하게 유지한다.
//
// 주의: 차단어 목록은 완전하지 않다(휴리스틱). 짧고 모호한 영문어는 오탐을 피하려 넣지 않는다.

export const DEFAULT_BLOCKLIST = [
  // 한국어(명백한 성인/스팸)
  '야동', '야설', '성인물', '19금', '능욕', '근친', '암퇘지', '뚱녀', '거유', '후장',
  '자위', '섹트', '섹블', '웹하드', '넷파일', '해외av', '일본av', '노예녀', '성인방',
  // 영어
  'porn', 'xxx', 'nsfw', 'onlyfans',
];

/**
 * 차단어(대소문자 무시)를 텍스트에 포함하는 게시물을 제외한다.
 * @param {any[]} posts
 * @param {string[]} blocklist
 */
export function filterSafe(posts, blocklist = DEFAULT_BLOCKLIST) {
  if (!Array.isArray(posts)) return [];
  const bl = (Array.isArray(blocklist) ? blocklist : []).map((s) => String(s).toLowerCase());
  if (bl.length === 0) return posts.slice();
  return posts.filter((p) => {
    const text = String(p?.text ?? '').toLowerCase();
    return !bl.some((b) => text.includes(b));
  });
}
