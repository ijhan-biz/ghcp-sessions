# Rollback Note (Day2-S5)

- Trigger: AC 회귀 / 테스트 실패 / 금지 파일 변경 감지
- Owner: [담당자/PL 이름]
- Action: `git restore <files>` 또는 해당 local commit revert
- Verify: `npm run gate`
- Completion: baseline green, 스펙 v1 상태로 복구

> release-readiness 진입 시 dry-run 으로 MTTR·owner·신호를 미리 기록한다. 되돌림을 "처음" 해보는 일이 없게.
