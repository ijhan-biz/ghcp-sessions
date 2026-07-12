# Context Manifest (Day1-S3)

> 구현에 필요한 파일만 좁힌다 = 토큰 절약 + 데이터 경계(OR-12).

## ActivityWatch 목표 참고 질문
- 실습 경계는 `collector` → 비식별 `{ app, start, end }` event → 순수 분석 함수입니다. 실제 watcher·브라우저·DB는 구현 범위가 아닙니다.
- ActivityWatch의 `timestamp + duration + data` 형식을 추정 구현하지 말고, 이 프로젝트의 `start/end` 계약만 사용합니다.
- 원본 창 제목·URL·계정 정보·`.env`를 blocked로 둡니다. 유효 event 필터·시작 시각 정렬·겹침 시 최대 end 확장은 소스 TODO의 고정 계약이며, 명시적 AFK·날짜 필터처럼 core에 없는 새 기능만 unknown/stretch 질문으로 남깁니다.

| 구분 | 파일 | 의미 |
| --- | --- | --- |
| allowed | `src/activity.js` | [D1-S3 작성] |
| allowed | `test/activity.test.js` | [D1-S3 작성] |
| blocked | `.env`, `prod/*`, `secrets/*` | [D1-S3 작성] |
| test | `test/activity.test.js` | [D1-S3 작성] |
| unknown | [D1-S3 작성] | [D1-S3 작성] |

## 메모
- 사고 범위를 이 파일들로 제한하는 이유: [D1-S3 작성]
