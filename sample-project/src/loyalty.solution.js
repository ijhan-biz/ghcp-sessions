// src/loyalty.solution.js
// 참고용 정답 — Day2-S4 SDD 실습을 직접 해본 뒤 비교용으로만 보세요.
// (테스트는 loyalty.js 를 대상으로 합니다. 이 파일은 import 되지 않습니다.)

export const EARN_RATE = { basic: 0.01, silver: 0.02, gold: 0.05 };

export function earnPoints(amount, opts = {}) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    throw new TypeError('amount must be a number');
  }
  if (amount < 0) throw new RangeError('amount must be >= 0');
  const rate = EARN_RATE[opts.tier ?? 'basic'] ?? EARN_RATE.basic;
  return Math.floor(amount * rate);
}

export function usePoints(balance, points) {
  if (typeof balance !== 'number' || typeof points !== 'number') {
    throw new TypeError('balance/points must be numbers');
  }
  if (points < 0) throw new RangeError('points must be >= 0');
  if (points > balance) throw new RangeError('insufficient points');
  return balance - points;
}
