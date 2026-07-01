// src/loyalty.js
// 멤버십 포인트 서비스 — 폴백 실습용 "본인 기능 스펙 후보" 코드베이스.
// 본인 기능을 못 가져온 참가자가 이 프로젝트를 '내 기능'처럼 채택해 2일 과정을 진행합니다.
//
// 현재 구현:
//   - earnPoints(적립)은 정상 동작(등급별 비율 + 음수 가드).
//   - usePoints(사용)은 "정상 차감"만 처리하고, 가드(음수/잔액 초과)는 비어 있습니다.
// Day2-S4 SDD test-first: test/loyalty.test.js 의 { skip: true } 를 제거하고
// usePoints 의 가드를 직접 구현하세요. 정답 비교: src/loyalty.solution.js

export const EARN_RATE = { basic: 0.01, silver: 0.02, gold: 0.05 };

/**
 * 결제 금액에 대해 등급별 포인트를 적립한다(원 단위 내림).
 * @param {number} amount 결제 금액(원)
 * @param {{ tier?: 'basic'|'silver'|'gold' }} [opts]
 * @returns {number} 적립 포인트
 */
export function earnPoints(amount, opts = {}) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    throw new TypeError('amount must be a number');
  }
  if (amount < 0) throw new RangeError('amount must be >= 0');
  const rate = EARN_RATE[opts.tier ?? 'basic'] ?? EARN_RATE.basic;
  return Math.floor(amount * rate);
}

/**
 * 보유 잔액에서 포인트를 사용(차감)한다.
 * @param {number} balance 현재 포인트 잔액
 * @param {number} points 사용할 포인트
 * @returns {number} 사용 후 잔액
 */
export function usePoints(balance, points) {
  // TODO(Day2-S4 SDD): 아래 가드를 구현하세요.
  //   - points < 0 이면 RangeError('points must be >= 0')
  //   - points > balance 이면 RangeError('insufficient points')
  return balance - points;
}
