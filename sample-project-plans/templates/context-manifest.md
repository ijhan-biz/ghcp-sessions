# Context Manifest (완성 예시 · Day1-S3)

> 구현에 필요한 파일만 좁힌다 = 토큰 절약 + 데이터 경계(OR-12).

| 구분 | 파일 | 의미 |
| --- | --- | --- |
| allowed | `src/board.js`, `src/card.js`, `src/query.js` | 도메인 코어 수정 허용 |
| allowed | `src/engine.js`, `src/store.js` | 부수효과 경계(주입) |
| allowed | `test/*.test.js` | 테스트 |
| blocked | `.env`, `prod/*`, `secrets/*` | 변경 금지(policy-check가 감지) |
| test | `test/*.test.js` | 검증 파일 |
| unknown | 실제 DB/파일/클라우드 어댑터 | 과정 범위 밖(비목표) — fake store 로 대체, 추정 금지 |

## 메모
- blocked 목록은 `scripts/policy-check.mjs` 의 감지 대상과 일치시킨다.
- 부수효과(저장·id·시간)는 `src/engine.js`·`src/store.js` 경계로만 들어온다 — 코어는 순수 유지.
