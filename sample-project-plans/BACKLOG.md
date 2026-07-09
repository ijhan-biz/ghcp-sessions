# 슬라이스 백로그 (완성본 — 전부 DONE)

이 프로젝트는 **완성된 예시**라, 아래 slice 들이 모두 test-first 로 구현되어 green 입니다.
각 slice 는 "얇은 단위(1~2 파일 · 실패 테스트 → 최소 구현)"로 쪼갠 뒤 게이트를 통과했습니다.
새로 배우는 사람은 이 순서를 **역으로 따라가며** "어떻게 이 상태에 도달했는지" 재현해 볼 수 있습니다.

| # | slice | 상태 | 무엇을 | 검증 |
| --- | --- | --- | --- | --- |
| 1 | 카드 이동/재정렬 `moveCard` | ✅ done | order 배열 splice + listId 갱신, 인덱스 clamp | `test/board.test.js` |
| 2 | 라벨 정의·배정·필터 | ✅ done | 보드 라벨 정의 + 카드 배정(멱등) + `search({labelIds})` | `test/card·query.test.js` |
| 3 | 마감일·overdue | ✅ done | `setDue`/`setDueDone` + `isOverdue(now)` 결정론 | `test/card·query.test.js` |
| 4 | 체크리스트·진행률 | ✅ done | 항목 토글 + `checklistProgress` % | `test/card.test.js` |
| 5 | 검색·통계·렌더 | ✅ done | text/label/member/due 필터 AND + `boardStats`/`renderBoard` | `test/query.test.js` |
| 6 | 저장 경계(주입형 store) | ✅ done | `loadState`/`saveState` 안전 폴백(fake store) | `test/store.test.js` |
| 7 | 엔진(id/clock 주입)·복사 | ✅ done | `createEngine` + `copyCard`/`copyList`/`copyBoard`(라벨 재매핑) | `test/engine.test.js` |
| 8 | 코멘트·첨부(메타) | ✅ done | 코멘트 CRUD + 첨부 메타데이터(비목표: 실제 업로드) | `test/card.test.js` |

## 2일 매핑 (이 완성본이 걸어온 길)
- **Day1(좋은 입력):** 스펙 채택(S1) → User Story·AC 정상/예외/경계(S2) → Context Manifest(S3) →
  Plan·Test Matrix(S4) → Spec Pack v1(S5) = [`FEATURE-SPEC.md`](FEATURE-SPEC.md).
- **Day2(안전한 실행):** 하네스·게이트(S1~S3) → 각 slice test-first 구현(S4~S5) →
  Custom Skill/Agent·모델 라우팅(S6) → 경험 공유(S7).

## 확장 아이디어 (다음 slice 후보)
- 라벨 여러 개 OR 필터, 담당자별 보드(스윔레인), 카드 정렬 키(우선순위), 활동 피드(activity log) 집계,
  마감 임박(dueSoon) 버킷, 보드 템플릿에서 새 보드 생성.
