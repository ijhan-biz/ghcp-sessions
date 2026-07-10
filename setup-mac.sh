#!/usr/bin/env bash
# GitHub Copilot 중급과정 — macOS 개발 환경 점검 & 자동 교정
#
# Dev Container/Docker 없이, "현재 터미널(host)"의 개발 환경이 정상인지 점검하고
# 누락/구버전을 자동으로 바로잡습니다. 마지막에 Day1 예제(labs)와 Day2 폴백
# (sample-project-activity-log)을 실제로 실행해
# "수강 준비 완료(READY)" 여부를 판정합니다.
#
# 사용법:
#   bash setup-mac.sh           # 점검 + 자동 교정(누락 설치 / Node 18+ 업그레이드)
#   bash setup-mac.sh --check   # 교정 없이 점검만(현재 상태 확인)
set -uo pipefail

CHECK_ONLY=0
[ "${1:-}" = "--check" ] && CHECK_ONLY=1

cyan(){ printf "\033[36m%s\033[0m\n" "$1"; }
ok(){   printf "  \033[32m✓\033[0m %s\n" "$1"; }
warn(){ printf "  \033[33m!\033[0m %s\n" "$1"; }
bad(){  printf "  \033[31m✗\033[0m %s\n" "$1"; }
fix(){  printf "  \033[35m⟳\033[0m %s\n" "$1"; }
have(){ command -v "$1" >/dev/null 2>&1; }
node_major(){ node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/'; }

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

cyan "== GitHub Copilot 중급과정 — 환경 점검 & 자동 교정 (macOS) =="
if [ "$CHECK_ONLY" = "1" ]; then echo "(check-only: 교정 없이 점검만)"; else echo "(누락/구버전은 Homebrew로 자동 교정합니다)"; fi

# ---------------------------------------------------------------- 자동 교정 단계
if [ "$CHECK_ONLY" = "0" ]; then
  if ! have brew; then
    warn "Homebrew 미설치 — https://brew.sh 에서 설치 후 다시 실행하세요. 자동 교정을 건너뜁니다."
  else
    ok "Homebrew 확인"
    have git || { fix "git 설치"; brew install git; }
    if have node; then
      if [ "$(node_major)" -lt 18 ] 2>/dev/null; then fix "Node $(node -v) → 18+ 업그레이드"; brew upgrade node || brew install node; fi
    else fix "Node 설치"; brew install node; fi
    have code || { fix "VS Code 설치"; brew install --cask visual-studio-code; }
  fi

  # VS Code 확장 (Copilot / Copilot Chat)
  if have code; then
    for ext in GitHub.copilot GitHub.copilot-chat; do
      if code --list-extensions 2>/dev/null | grep -qix "$ext"; then ok "VS Code 확장 확인: $ext"
      else fix "VS Code 확장 설치: $ext"; code --install-extension "$ext" >/dev/null 2>&1 || warn "확장 설치 건너뜀: $ext"; fi
    done
  fi
fi

# ---------------------------------------------------------------- 점검 단계
echo
cyan "== 환경 점검 =="
PASS=1
if have node; then
  NV="$(node -v)"; NMAJ="$(node_major)"
  if [ "${NMAJ:-0}" -ge 18 ] 2>/dev/null; then ok "Node $NV"; else bad "Node $NV (18+ 필요 — '--check' 없이 다시 실행하면 자동 업그레이드)"; PASS=0; fi
else bad "Node 미설치 (필수)"; PASS=0; fi
have git && ok "git $(git --version | awk '{print $3}')" || { bad "git 미설치 (필수)"; PASS=0; }
have code && ok "VS Code (code CLI)" || warn "VS Code code CLI 미확인(GUI만 있어도 무방)"

# ---------------------------------------------------------------- 준비 완료 테스트(실습 코드 실행)
echo
cyan "== 실습 코드 실행 테스트 (Day1 labs + Day2 activity-log) =="
for project in labs sample-project-activity-log; do
  out="/tmp/ghcp_${project//-/_}_test.out"
  if have node && [ -f "$project/package.json" ]; then
    if ( cd "$project" && npm test ) >"$out" 2>&1; then
      echo "  [$project]"
      grep -E "^# (tests|pass|fail|skipped)" "$out" | sed 's/^/    /'
      ok "$project 테스트 실행 성공"
    else
      bad "$project 테스트 실패 — 아래 출력 확인"; tail -n 15 "$out" | sed 's/^/    /'; PASS=0
    fi
  else
    bad "$project 실행 테스트 불가(Node 또는 package.json 없음)"; PASS=0
  fi
done

echo
if [ "$PASS" = "1" ]; then
  cyan "결과: READY ✅ — 교육 실습을 시작할 수 있습니다."
  exit 0
else
  cyan "결과: NOT READY ❌ — 위 ✗ 항목을 해결한 뒤(또는 '--check' 없이 재실행) 다시 확인하세요."
  exit 1
fi
