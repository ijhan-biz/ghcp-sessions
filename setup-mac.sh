#!/usr/bin/env bash
# GitHub Copilot 중급과정 — macOS 사전설치 & 준비도 점검
#
# 사용법:
#   bash setup-mac.sh           # 누락 도구를 Homebrew로 설치한 뒤 준비도 점검
#   bash setup-mac.sh --check   # 설치 없이 준비도만 점검(이미 설치된 환경 확인용)
#
# 이미 설치된 도구는 건너뜁니다(idempotent). 마지막에 실습 코드(labs)를 실제로
# 실행해 "수강 준비 완료" 여부를 판정합니다.
set -uo pipefail

CHECK_ONLY=0
[ "${1:-}" = "--check" ] && CHECK_ONLY=1

cyan(){ printf "\033[36m%s\033[0m\n" "$1"; }
ok(){   printf "  \033[32m✓\033[0m %s\n" "$1"; }
warn(){ printf "  \033[33m!\033[0m %s\n" "$1"; }
bad(){  printf "  \033[31m✗\033[0m %s\n" "$1"; }
have(){ command -v "$1" >/dev/null 2>&1; }

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

cyan "== GitHub Copilot 중급과정 사전설치 (macOS) =="
[ "$CHECK_ONLY" = "1" ] && echo "(check-only 모드: 설치 없이 점검만 수행)"

# ---------------------------------------------------------------- 설치 단계
if [ "$CHECK_ONLY" = "0" ]; then
  if ! have brew; then
    warn "Homebrew 미설치 — https://brew.sh 에서 먼저 설치 후 다시 실행하세요. 자동 설치를 건너뜁니다."
  else
    ok "Homebrew 확인"
    have git    || brew install git
    have node   || brew install node
    have gh     || brew install gh
    have docker || brew install --cask docker
    have code   || brew install --cask visual-studio-code
  fi

  # gh copilot CLI 확장 (best effort)
  if have gh; then
    if gh extension list 2>/dev/null | grep -q 'gh-copilot'; then ok "gh-copilot 확장 확인"
    else gh extension install github/gh-copilot 2>/dev/null || warn "gh-copilot 확장 설치 건너뜀(인증/네트워크 확인 필요)"; fi
  fi

  # VS Code 확장 (Copilot / Copilot Chat / Dev Containers)
  if have code; then
    for ext in GitHub.copilot GitHub.copilot-chat ms-vscode-remote.remote-containers; do
      if code --list-extensions 2>/dev/null | grep -qix "$ext"; then ok "VS Code 확장 확인: $ext"
      else code --install-extension "$ext" >/dev/null 2>&1 && ok "VS Code 확장 설치: $ext" || warn "VS Code 확장 설치 건너뜀: $ext"; fi
    done
  fi
fi

# ---------------------------------------------------------------- 점검 단계
echo
cyan "== 준비도 점검 =="
PASS=1
if have node; then
  NV="$(node -v)"; NMAJ="${NV#v}"; NMAJ="${NMAJ%%.*}"
  if [ "$NMAJ" -ge 18 ] 2>/dev/null; then ok "Node $NV"; else bad "Node $NV (18+ 필요)"; PASS=0; fi
else bad "Node 미설치 (필수)"; PASS=0; fi
have git    && ok "git $(git --version | awk '{print $3}')"               || { bad "git 미설치 (필수)"; PASS=0; }
have gh     && ok "gh $(gh --version | head -1 | awk '{print $3}')"        || warn "gh CLI 미설치 (Copilot Chat fallback 가능)"
have docker && ok "Docker $(docker --version | awk '{print $3}' | tr -d ,)" || warn "Docker 미설치 (Host Node fallback 가능)"
have code   && ok "VS Code (code CLI)"                                      || warn "VS Code code CLI 미확인(GUI만 있어도 무방)"

# ---------------------------------------------------------------- 준비 완료 테스트(실습 코드 실행)
echo
cyan "== 실습 코드 실행 테스트 (labs) =="
if have node && [ -f labs/package.json ]; then
  if ( cd labs && npm test ) >/tmp/ghcp_labs_test.out 2>&1; then
    grep -E "^# (tests|pass|fail|skipped)" /tmp/ghcp_labs_test.out | sed 's/^/  /'
    ok "labs 테스트 실행 성공 — 실습 준비 완료"
  else
    bad "labs 테스트 실패 — 아래 출력 확인"; tail -n 15 /tmp/ghcp_labs_test.out | sed 's/^/    /'; PASS=0
  fi
else
  warn "labs 실행 테스트 건너뜀(Node 또는 labs/package.json 없음)"
fi

echo
if [ "$PASS" = "1" ]; then
  cyan "결과: READY ✅ — 교육 실습을 시작할 수 있습니다."
  exit 0
else
  cyan "결과: NOT READY ❌ — 위 ✗ 항목을 해결한 뒤 다시 실행하세요."
  exit 1
fi
