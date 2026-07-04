# Plan + Test Matrix (Day1-S4)

> 코드 작성 전에 계획·검증·롤백을 먼저 고정한다. Definition of Done: Code + Test + Required Check + Doc + Rollback Path.

## 구현 계획 (2~4단계, 각 단계 stop point)
1. 변경 목표:
2. 변경 파일 후보 + 근거(Context Manifest):
3. 단계 / stop point:
   - 1단계: ... (끝나면 멈추고 결과 보고)
   - 2단계: ...
4. risk tier (one-way / two-way door):
5. Human Gate(사람 승인 필요 작업):
6. Rollback note 초안: → templates/rollback-note.md

## Test Matrix (AC ↔ 테스트)

> 각 AC를 **정상·예외·경계** 중 하나로 분류하세요. 세 범주가 모두 최소 1개면 취합한 `spec.md`가 `npm run spec-check` 통과 기준을 만족합니다.

| AC | 범주 | 유형 | 테스트 이름 | 실행 | 완료 |
| --- | --- | --- | --- | --- | --- |
| AC1 음수=오류 | 예외 | unit | AC1 음수 금액은 오류 | `npm test` | pass |
| AC2 면세=0 | 경계 | unit | AC2 면세 품목은 VAT 0 | `npm test` | pass |
| AC3 일반=10% | 정상 | unit | AC3 일반 품목은 VAT 10% | `npm test` | pass |
| 금지 파일 불변 | 정책 | policy | policy-check | `npm run policy-check` | pass |
