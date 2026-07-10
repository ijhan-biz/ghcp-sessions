// src/billing/tax.js
// 부가세(VAT) 계산 모듈 — Day1 설명 예제의 핵심 파일.
//
// 이 파일은 여러 세션의 대상이 됩니다.
//  - Day1-S1 토큰 최적화: "이 함수만" 범위를 좁혀 프롬프트 작성
//  - Day1-S3 리팩토링/Context Manifest: allowed 파일로 지정
//  - Day1-S4 Plan Mode: 변경 계획의 대상
//  - 선택형 SDD 미니 예제: 아래 TODO를 직접 구현 (test/tax.test.js의 skip 제거)
//
// 현재 구현은 "정상 케이스(일반 품목)"만 처리합니다. 음수 가드와 면세 분기는
// 의도적으로 비어 있습니다 — 선택형 미니 예제로 테스트를 먼저 켜고 구현할 수 있습니다.

export const VAT_RATE = 0.1; // 일반 품목 부가세율 10%

/**
 * 부가세를 계산한다.
 * @param {number} amount 과세 대상 금액(원)
 * @param {{ exempt?: boolean }} [opts] 면세 여부
 * @returns {number} 부가세(원, 반올림)
 */
export function calcVat(amount, opts = {}) {
  // TODO(선택형 SDD 미니 예제): 음수 금액 가드 + 면세(exempt) 분기를 구현하세요.
  //   - amount < 0 이면 RangeError('amount must be >= 0') 를 던진다.
  //   - opts.exempt === true 이면 0 을 반환한다.
  // 구현 후 test/tax.test.js 의 { skip: true } 두 곳을 제거하고 `npm test` 로 확인.
  return Math.round(amount * VAT_RATE);
}
