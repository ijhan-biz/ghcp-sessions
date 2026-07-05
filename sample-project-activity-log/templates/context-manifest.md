# Context Manifest (Day1-S3)

> 구현에 필요한 파일만 좁힌다 = 토큰 절약 + 데이터 경계(OR-12).

| 구분 | 파일 | 의미 |
| --- | --- | --- |
| allowed | `labs/src/billing/tax.js` | 수정 허용 |
| allowed | `labs/test/tax.test.js` | 테스트 |
| blocked | `.env`, `prod/*`, `secrets/*` | 변경 금지(policy-check가 감지) |
| test | `labs/test/*.test.js` | 검증 파일 |
| unknown | (모르면 탐색 질문으로) | 추정 금지 |

## 메모
- blocked 목록은 `labs/scripts/policy-check.mjs` 의 감지 대상과 일치시킨다.
