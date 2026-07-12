# 비식별 기능 스펙 카드 (Day1-S1)

> 공통 activity-log 기능을 비식별 상태로 작성하세요. 고객명/계정/키/운영 로그 원문 금지(OR-13).

## ActivityWatch 목표 참고 질문
> [ActivityWatch](https://github.com/ActivityWatch/activitywatch)는 제품 방향 레퍼런스이며 완전 호환 요구사항이 아닙니다. Day1에는 아래 결정을 쓰고, Day2에는 `sessionize` core만 구현합니다.

- 사용자: 오늘의 앱 활동과 집중이 끊긴 구간을 보고 어떤 결정을 내리는가?
- Core 계약: 합성 event `{ app, start, end }`를 받아 `[{ start, end, count }]`를 반환하며, 어떤 `idleGapMs` 경계를 쓰는가?
- Stretch(선택): 기본값은 none이다. core와 gate가 GREEN이고 시간이 남을 때만 카테고리별 시간·명시적 AFK·하루 타임라인/필터·합성 JSON import/export 중 0개 또는 1개를 별도 backlog에 남길 것인가?
- Non-goal·프라이버시: 실제 watcher, 원본 창 제목/URL, DB/서버/전체 UI, API 호환을 제외했는가? 로컬 데이터도 민감하다고 가정했는가?

- 기능명: [D1-S1 작성]
- 현재 동작: [D1-S1 작성]
- 원하는 동작: [D1-S1 작성]
- 사용자/시스템 영향: [D1-S1 작성]
- 제외 범위(non-goal): [D1-S1 작성]
- 민감정보 제거 확인: [D1-S1 작성]
- 검증 명령: [D1-S1 작성]

## User Story (Day1-S2)
[D1-S2 작성]

## Acceptance Criteria (Day1-S2)
| 범주 | 검증 가능한 기준 | 검증 방법 |
| --- | --- | --- |
| 정상 | [D1-S2 작성] | [D1-S2 작성] |
| 예외 | [D1-S2 작성] | [D1-S2 작성] |
| 경계 | [D1-S2 작성] | [D1-S2 작성] |
