# sample-project-web-curation — 폴백 실습 프로젝트 (대안 도메인)

**검색 결과 정리(큐레이션) 엔진.** 본인 기능을 못 가져온 참가자가 "내 기능"처럼 채택해
Day1~Day2 전 과정을 진행하는 **폴백 실습 프로젝트**입니다. 의존성 없이 Node 18+ 로 동작합니다.

> **설계 경계:** 실제 웹 fetch/크롤링은 하지 않습니다(네트워크·비결정성·API 키 → 테스트 불가).
> "이미 수집된 검색 결과 목록"을 받아 정규화·중복제거·랭킹·요약하는 **순수 로직**만 다룹니다.

## 시작
```sh
cd sample-project-web-curation
npm test        # baseline: 4 pass, 2 skip(Day2-S4에서 켤 테스트)
```

## 이렇게 진행하세요
1. `FEATURE-SPEC.md` 를 "내 기능 스펙 카드"로 채택 (D1·S1)
2. `BACKLOG.md` 에서 slice 1개 선택 (권장 #1: URL 정규화 중복제거)
3. **D1**: User Story·AC(S2) → Context Manifest(S3) → Plan·Test Matrix(S4) → Spec Pack v1(S5)
4. **D2**: 하네스·게이트(S1~S3) → test-first 로 `test/curate.test.js` 의 `skip` 해제 → `src/curate.js` 의 `normalizeUrl` 구현(S4~S5) → Custom Skill(S6) → 공유(S7)
5. 정답 비교: `src/curate.solution.js`

## 파일
| 파일 | 용도 |
| --- | --- |
| `FEATURE-SPEC.md` | 비식별 기능 스펙 카드(참가자가 채택) |
| `BACKLOG.md` | slice 후보(하나 골라 진행) |
| `src/curate.js` | 대상 코드(`normalizeUrl` = TODO) |
| `test/curate.test.js` | 통과 4 + skip 2(구현 대상) |
| `src/curate.solution.js` | 참고 정답 |
