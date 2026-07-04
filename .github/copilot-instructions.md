# GitHub Instructions

## Rule
- Do not push to remote repositories.
- Do not run `git push`.
- If a push is needed, ask the user first and wait for explicit approval.

## Workflow
- Make changes locally.
- Use local validation (tests/lint) only.
- Share commit hashes and diffs without pushing.

## 응답 표시 — 입력 토큰 근사치 (토큰 인식 훈련 · D1·S1)
- **모든 답변의 맨 끝에** 한 줄로 "입력 토큰 근사치"를 표시한다.
  - 형식(고정):
    `> 📊 입력 토큰 근사치: ~<N> tokens · 오프라인 추정, 실제 청구 토큰 아님`
  - `<N>` 추정 규칙(결정론적, 도구 `labs/scripts/token-estimate.mjs`와 동일):
    이번 턴에 실제로 받은 입력 = (사용자 메시지 + 첨부·참조된 파일 내용)의
    **ASCII 문자수 ÷ 4 + 비ASCII(한글·CJK 등) 문자수 × 1.3**, 반올림.
  - 목적: 범위를 좁힐수록 입력이 줄어드는 감각을 **매 답변에서** 체감한다.
    절대값이 아니라 Before/After **비율**을 본다. 근사치(±20~40%)이며 정확 계량이 아니다.
- **정확한 소비**는 표시할 수 없다(Chat엔 요청당 실시간 계량기가 없음).
  실제 AI Credits 소비(2026-06-01~ 토큰 기반)는 조직 **Usage 대시보드**로 확인한다.
- 이 표시는 학습용이므로, 코드 블록·명령 출력 등 답변 본문에는 영향을 주지 않는다(맨 끝 한 줄만 추가).
