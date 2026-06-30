// src/billing/discount.js
// Day1-S3 "리팩토링·복잡 로직" 실습 대상.
//
// 이 함수는 "동작은 맞지만 읽기 어려운" 코드입니다(중첩 분기·매직 넘버·축약 변수).
// 실습 목표: 동작(test/discount.test.js)을 절대 바꾸지 않고 가독성만 높이세요.
//   - 등급/임계값을 상수로 분리
//   - 중첩 if 를 평탄화하거나 표(lookup)로 단순화
//   - 의미 있는 변수명 사용
// 리팩토링 후에도 `npm test` 가 그대로 green 이어야 합니다.

export function applyDiscount(amount, tier) {
  let r = 0;
  if (tier == 'gold') {
    if (amount >= 100000) { r = amount * 0.2; } else { r = amount * 0.1; }
  } else {
    if (tier == 'silver') {
      if (amount >= 100000) { r = amount * 0.1; } else { r = amount * 0.05; }
    } else {
      r = 0;
    }
  }
  return Math.round(amount - r);
}
