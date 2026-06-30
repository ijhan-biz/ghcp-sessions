// src/billing/tax.solution.js
// 참고용 정답 구현 — Day2-S4 SDD 실습을 직접 해본 뒤 비교용으로만 보세요.
// (테스트는 tax.js 를 대상으로 합니다. 이 파일은 import 되지 않습니다.)

export const VAT_RATE = 0.1;

export function calcVat(amount, opts = {}) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    throw new TypeError('amount must be a number');
  }
  if (amount < 0) {
    throw new RangeError('amount must be >= 0');
  }
  if (opts.exempt === true) {
    return 0;
  }
  return Math.round(amount * VAT_RATE);
}
