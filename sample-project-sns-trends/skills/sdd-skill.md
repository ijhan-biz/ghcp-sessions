# 기능 스펙 SDD 보조 Skill (Day2-S6)

## 목적
비식별 기능 스펙을 User Story·Acceptance Criteria·Test Matrix·구현 계획으로 정리한다.

## 입력
- Feature Spec Card / Context Manifest / 현재 테스트 결과(`npm test`)

## 절차
1. 민감정보/고객 데이터가 있는지 먼저 확인한다.
2. User Story·AC 를 SMART + 측정 source 로 정제한다.
3. allowed / blocked 파일을 분리한다(Context Manifest).
4. test-first 순서로 계획을 만든다.
5. 구현 전 human gate 가 필요한 항목을 표시한다.

## 금지
- 실제 고객명/계정/secret 추정
- 외부 패키지 추가 제안
- 승인 없는 운영/배포/삭제 명령 제안

## 출력
- AC 표 · Context Manifest · Test Matrix · Plan · Risk/Human Gate · Rollback Note
