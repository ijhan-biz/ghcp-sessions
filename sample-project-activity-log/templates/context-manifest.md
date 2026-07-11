# Context Manifest (Day1-S3)

> 구현에 필요한 파일만 좁힌다 = 토큰 절약 + 데이터 경계(OR-12).

| 구분 | 파일 | 의미 |
| --- | --- | --- |
| allowed | `src/activity.js` | [D1-S3 작성] |
| allowed | `test/activity.test.js` | [D1-S3 작성] |
| blocked | `.env`, `prod/*`, `secrets/*` | [D1-S3 작성] |
| test | `test/activity.test.js` | [D1-S3 작성] |
| unknown | [D1-S3 작성] | [D1-S3 작성] |

## 메모
- 사고 범위를 이 파일들로 제한하는 이유: [D1-S3 작성]
