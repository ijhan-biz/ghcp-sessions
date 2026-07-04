#!/usr/bin/env zsh
# scripts/copilot-harness/run.zsh
# Day2-S1/S2: Copilot CLI 하네스 래퍼.
# 권한 플래그·로그 경로·출력 형식을 한곳에 고정한다(프롬프트마다 새로 쓰지 않음).
# gh copilot 이 없거나 미인증이면 '무엇을 실행할지'만 출력하는 dry-run 으로 동작(교육 fallback).
set -euo pipefail

prompt="${*:-}"
if [[ -z "$prompt" ]]; then
  echo "usage: scripts/copilot-harness/run.zsh <prompt>" >&2
  exit 2
fi

mkdir -p .copilot-harness/logs

if command -v gh >/dev/null 2>&1 && gh copilot --help >/dev/null 2>&1; then
  exec gh copilot -- -p "$prompt" \
    --allow-tool 'shell(git)' \
    --allow-tool 'shell(npm test)' \
    --deny-tool  'shell(rm)' \
    --deny-tool  'shell(git push --force)' \
    --log-dir .copilot-harness/logs \
    --output-format json
else
  echo "[dry-run] gh copilot 미설치/미인증 — 실제 호출 대신 적용될 정책만 출력합니다."
  echo "[dry-run] prompt  : ${prompt}"
  echo "[dry-run] allow   : shell(git), shell(npm test)"
  echo "[dry-run] deny    : shell(rm), shell(git push --force)"
  echo "[dry-run] log-dir : .copilot-harness/logs"
  echo "[dry-run] format  : json"
  echo "[dry-run] 원칙: 프롬프트만으로는 안전하지 않다 — 정책은 실행 경계에 붙인다."
fi
