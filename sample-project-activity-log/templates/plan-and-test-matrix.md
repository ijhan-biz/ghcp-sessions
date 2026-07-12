# Plan + Test Matrix (Day1-S4)

> 코드 작성 전에 계획·검증·롤백을 먼저 고정한다. Definition of Done: Code + Test + Required Check + Doc + Rollback Path.

## ActivityWatch 목표 참고 질문
- Core: `test/activity.test.js`의 skip 2개와 `src/activity.js` TODO를 읽고, RED 확인부터 최소 구현·GREEN·gate까지의 2~4단계를 직접 쓰세요.
- Matrix: fixture에서 임계값 초과와 정확히 같은 경우의 기대값을 계산하고, 예외 행은 기존 무효 event 또는 collector 실패 테스트와 연결하세요.
- Stretch 기본값은 none입니다. core와 gate가 GREEN이고 시간이 남을 때만 0개 또는 1개를 별도 backlog에 두며, 실제 watcher·전체 UI·REST/query 호환은 계획에 넣지 않습니다.

## 구현 계획 (2~4단계, 각 단계 stop point)
1. 변경 목표(`sessionize`): [D1-S4 작성]
2. 변경 파일 후보 + 근거(Context Manifest): [D1-S4 작성]
3. RED stop point: [D1-S4 작성]
4. 최소 구현 후 GREEN stop point: [D1-S4 작성]
5. gate stop point: [D1-S4 작성]
6. risk tier + Human Gate: [D1-S4 작성]
7. Rollback 초안(trigger/owner/action/verify): [D1-S4 작성]

## Test Matrix (AC ↔ 테스트)

> 각 AC를 **정상·예외·경계** 중 하나로 분류하세요. 세 범주가 모두 최소 1개면 취합한 `spec.md`가 `npm run spec-check` 통과 기준을 만족합니다.

| AC | 범주 | 유형 | 테스트 이름 | 실행 | 완료 |
| --- | --- | --- | --- | --- | --- |
| [D1-S4 작성] | 정상 | [D1-S4 작성] | [D1-S4 작성] | [D1-S4 작성] | todo |
| [D1-S4 작성] | 경계 | [D1-S4 작성] | [D1-S4 작성] | [D1-S4 작성] | todo |
| [D1-S4 작성] | 예외 | [D1-S4 작성] | [D1-S4 작성] | [D1-S4 작성] | todo |
