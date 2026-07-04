# GitHub Instructions

## Rule
- Do not push to remote repositories.
- Do not run `git push`.
- If a push is needed, ask the user first and wait for explicit approval.

## Workflow
- Make changes locally.
- Use local validation (tests/lint) only.
- Share commit hashes and diffs without pushing.

## 교재 작성 규칙 — 예시 코드 앞에 맥락 먼저
- 세션 문서(`docs/*.html`)·실습 자료에 `<pre><code>` 예시 코드를 넣을 때는, **코드 블록 바로 앞에 맥락을 먼저** 둔다. 코드부터 던지지 않는다.
  - 맥락에 담을 것: (a) 이 코드가 **무엇**인지(프롬프트·명령·템플릿·파일 발췌 등), (b) 해당되면 **어느 파일/어디**서 오는지, (c) **무엇을 하려는지**(목적).
  - 형태: `.step`의 `<div class="label">…</div>`(짧은 제목) 또는 바로 앞 `<p>`/callout 문장이면 된다. 라벨이 번호만 있으면("STEP 1") 무엇을 하는 단계인지 한마디 덧붙인다.
  - 예: `<div class="label">권한·로그를 좁힌 하네스 래퍼(발췌)</div>` → 코드. "이 래퍼는 …를 고정한다"처럼 목적을 앞 문단이 설명하면 더 좋다.
- 목적: 학습자가 코드를 읽기 전에 "이게 무엇이고 왜/어디에 쓰이는지"를 먼저 알게 한다.

## 응답 표시 — 입력/출력 토큰 근사치 (토큰 인식 훈련 · D1·S1)
- **모든 답변의 맨 끝에** 한 줄로 "입력/출력 토큰 근사치"를 표시한다.
  - 형식(고정):
    `> 📊 토큰 근사치: 입력 ~<N_in> · 출력 ~<N_out> tokens · 오프라인 추정, 실제 청구 토큰 아님`
  - 추정 규칙(결정론적, 도구 `labs/scripts/token-estimate.mjs`와 동일 — **ASCII 문자수 ÷ 4 + 비ASCII(한글·CJK 등) 문자수 × 1.3**, 반올림):
    - `<N_in>`  = 이번 턴에 받은 **입력**(사용자 메시지 + 첨부·참조된 파일 내용).
    - `<N_out>` = 이번 답변으로 생성한 **출력**(답변 본문 텍스트, 이 근사치 줄 자체는 제외).
  - 목적: 입력은 **범위 축소**로, 출력은 **간결함**으로 줄이는 감각을 매 답변에서 체감한다.
    절대값이 아니라 Before/After **비율**을 본다. 근사치(±20~40%)이며 정확 계량이 아니다.
- 과금(2026-06-01~ 토큰 기반)은 **입력+출력+캐시 토큰**을 함께 계산하므로 입력·출력 둘 다 비용이다.
  **정확한 소비**는 표시할 수 없고(Chat엔 요청당 실시간 계량기 없음), 조직 **Usage 대시보드**(AI Credits)로 확인한다.
- 이 표시는 학습용이므로 답변 본문에는 영향을 주지 않는다(맨 끝 한 줄만 추가).
