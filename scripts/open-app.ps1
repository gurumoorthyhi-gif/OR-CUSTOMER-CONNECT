$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$logDirectory = Join-Path $projectRoot 'runtime'
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null

function Test-Endpoint([string]$url) {
    try { return (Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 3).StatusCode -eq 200 }
    catch { return $false }
}

function Test-ImageProcessingReady {
    try {
        $health = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/image-processing/health' -TimeoutSec 5
        if (!$health.enabled) { return $true }
        return $health.background.ready -and $health.upscale.ready
    }
    catch { return $false }
}

Write-Host 'Connecting backend and starting the app...'
if (!(Test-Endpoint 'http://127.0.0.1:8000/health') -or !(Test-Endpoint 'http://127.0.0.1:3011/new-order') -or !(Test-ImageProcessingReady)) {
    $nodePath = (Get-Command node.exe).Source
    $startupScript = Join-Path $PSScriptRoot 'start-local.mjs'
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
    Start-Process -FilePath $nodePath -ArgumentList ('"' + $startupScript + '"') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDirectory "startup-$stamp.log") -RedirectStandardError (Join-Path $logDirectory "startup-$stamp-error.log") | Out-Null
}
$deadline = (Get-Date).AddSeconds(90)
do {
    if ((Test-Endpoint 'http://127.0.0.1:8000/health') -and (Test-Endpoint 'http://127.0.0.1:3011/new-order') -and (Test-ImageProcessingReady)) {
        Start-Process 'http://127.0.0.1:3011/new-order'
        exit 0
    }
    Start-Sleep -Seconds 1
} while ((Get-Date) -lt $deadline)
Write-Error "The app could not connect. Startup details are in $logDirectory."
