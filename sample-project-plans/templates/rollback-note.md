# Rollback Note (완성 예시 · Day2-S5)

- Trigger: AC 회귀 / 테스트 실패 / 금지 파일(.env·prod/·secrets/) 변경 감지
- Owner: [담당자/PL 이름]
- Action: `git restore <files>` 또는 해당 local commit revert
- Verify: `npm run gate` (lint + test + policy-check)
- Completion: 전체 테스트 green(0 skip), 스펙 v1 상태로 복구

> 이 프로젝트는 로컬 전용·two-way door 라 되돌리기가 쉽다(외부 부수효과 없음).
> 단, 실제 저장/배포 어댑터(`store` 구현·CI)를 붙이는 순간부터는 one-way door 요소가 생기므로,
> release-readiness 진입 시 dry-run 으로 MTTR·owner·신호를 미리 기록한다 — 되돌림을 "처음" 해보는 일이 없게.
