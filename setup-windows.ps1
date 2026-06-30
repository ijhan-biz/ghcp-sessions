<#
  GitHub Copilot 중급과정 — Windows 사전설치 & 준비도 점검

  사용법(PowerShell):
    powershell -ExecutionPolicy Bypass -File .\setup-windows.ps1           # 누락 도구 설치(winget) 후 점검
    powershell -ExecutionPolicy Bypass -File .\setup-windows.ps1 -Check    # 설치 없이 점검만

  이미 설치된 도구는 건너뜁니다. 마지막에 실습 코드(labs)를 실제로 실행해
  "수강 준비 완료" 여부를 판정합니다.
#>
param([switch]$Check)

function Have($cmd) { return [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Ok($m)   { Write-Host "  [ok] $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  [! ] $m" -ForegroundColor Yellow }
function Bad($m)  { Write-Host "  [x ] $m" -ForegroundColor Red }

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "== GitHub Copilot 중급과정 사전설치 (Windows) ==" -ForegroundColor Cyan
if ($Check) { Write-Host "(check-only 모드: 설치 없이 점검만 수행)" }

# ---------------------------------------------------------------- 설치 단계
if (-not $Check) {
  if (Have winget) {
    function WGInstall($id) {
      winget list --id $id -e 2>$null | Out-Null
      if ($LASTEXITCODE -ne 0) {
        winget install -e --id $id --accept-source-agreements --accept-package-agreements
      }
    }
    if (-not (Have git))    { WGInstall "Git.Git" }
    if (-not (Have node))   { WGInstall "OpenJS.NodeJS.LTS" }
    if (-not (Have gh))     { WGInstall "GitHub.cli" }
    if (-not (Have docker)) { WGInstall "Docker.DockerDesktop" }
    if (-not (Have code))   { WGInstall "Microsoft.VisualStudioCode" }
  } else {
    Warn "winget 미설치 — Microsoft Store 의 'App Installer' 설치 후 다시 실행하세요."
  }

  # gh copilot CLI 확장 (best effort)
  if (Have gh) {
    $exts = gh extension list 2>$null
    if ($exts -notmatch 'gh-copilot') { gh extension install github/gh-copilot 2>$null }
  }
  # VS Code 확장
  if (Have code) {
    foreach ($ext in @('GitHub.copilot','GitHub.copilot-chat','ms-vscode-remote.remote-containers')) {
      $list = code --list-extensions 2>$null
      if ($list -notcontains $ext) { code --install-extension $ext 2>$null | Out-Null }
    }
  }
}

# ---------------------------------------------------------------- 점검 단계
Write-Host "`n== 준비도 점검 ==" -ForegroundColor Cyan
$pass = $true
if (Have node) {
  $nv = node -v
  $maj = [int]($nv.TrimStart('v').Split('.')[0])
  if ($maj -ge 18) { Ok "Node $nv" } else { Bad "Node $nv (18+ 필요)"; $pass = $false }
} else { Bad "Node 미설치 (필수)"; $pass = $false }
if (Have git)    { Ok ("git " + (git --version).Split(' ')[2]) } else { Bad "git 미설치 (필수)"; $pass = $false }
if (Have gh)     { Ok "gh CLI" } else { Warn "gh CLI 미설치 (Copilot Chat fallback 가능)" }
if (Have docker) { Ok "Docker" } else { Warn "Docker 미설치 (Host Node fallback 가능)" }
if (Have code)   { Ok "VS Code (code CLI)" } else { Warn "VS Code code CLI 미확인(GUI만 있어도 무방)" }

# ---------------------------------------------------------------- 준비 완료 테스트(실습 코드 실행)
Write-Host "`n== 실습 코드 실행 테스트 (labs) ==" -ForegroundColor Cyan
if ((Have node) -and (Test-Path "labs/package.json")) {
  Push-Location labs
  $out = & npm test 2>&1
  $code = $LASTEXITCODE
  Pop-Location
  if ($code -eq 0) {
    ($out | Select-String "^# (tests|pass|fail|skipped)") | ForEach-Object { Write-Host ("  " + $_) }
    Ok "labs 테스트 실행 성공 — 실습 준비 완료"
  } else {
    Bad "labs 테스트 실패 — 출력 확인 필요"
    $out | Select-Object -Last 15 | ForEach-Object { Write-Host ("    " + $_) }
    $pass = $false
  }
} else {
  Warn "labs 실행 테스트 건너뜀(Node 또는 labs/package.json 없음)"
}

Write-Host ""
if ($pass) {
  Write-Host "결과: READY - 교육 실습을 시작할 수 있습니다." -ForegroundColor Cyan
  exit 0
} else {
  Write-Host "결과: NOT READY - 위 [x] 항목을 해결한 뒤 다시 실행하세요." -ForegroundColor Cyan
  exit 1
}
