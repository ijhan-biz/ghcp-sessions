# sample-project — 폴백 실습 프로젝트 (멤버십 포인트 서비스)

교육에서 **본인 기능 스펙 후보를 가져오지 못한 참가자**가 "내 기능"처럼 채택해
Day1~Day2 전 과정(스펙 → 프롬프트 → Plan → 하네스 → SDD → Skill → 공유)을
진행하기 위한 **얇고 실행 가능한 샘플**입니다. 의존성 없이 Node 18+ 로 동작합니다.

> `labs/` 는 강사 가이드용 예제(billing/VAT)이고, 여기 `sample-project/` 는
> **참가자가 자기 기능처럼 끌고 갈 폴백**입니다. 도메인이 겹치지 않게 분리했습니다.

## 시작
```sh
cd sample-project
npm test        # baseline: 4 pass, 2 skip(Day2-S4에서 켤 테스트)
```

## 이렇게 진행하세요
1. `FEATURE-SPEC.md` 를 "내 기능 스펙 카드"로 채택 (D1·S1)
2. `BACKLOG.md` 에서 slice 1개 선택 (권장 #1)
3. **D1**: User Story·AC(S2) → Context Manifest(S3) → Plan·Test Matrix(S4) → Spec Pack v1(S5)
4. **D2**: 하네스·게이트(S1~S3) → test-first 로 `test/loyalty.test.js` 의 `skip` 해제 → `src/loyalty.js` 구현(S4~S5) → Custom Skill(S6) → 공유(S7)
5. 정답 비교: `src/loyalty.solution.js`

## 파일
| 파일 | 용도 |
| --- | --- |
| `FEATURE-SPEC.md` | 비식별 기능 스펙 카드(참가자가 채택) |
| `BACKLOG.md` | slice 후보(하나 골라 진행) |
| `src/loyalty.js` | 대상 코드(usePoints 가드 = TODO) |
| `test/loyalty.test.js` | 통과 4 + skip 2(구현 대상) |
| `src/loyalty.solution.js` | 참고 정답 |
