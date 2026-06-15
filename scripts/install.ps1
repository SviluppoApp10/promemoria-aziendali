# Promemoria Aziendali — Script di installazione per Windows PowerShell
$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PROMEMORIA AZIENDALI — Installazione" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verifica Node.js
try {
    $nodeVersion = (node -v).Replace("v","").Split(".")[0]
    if ([int]$nodeVersion -lt 18) {
        Write-Host "ERRORE: Node.js >= 18 richiesto" -ForegroundColor Red; exit 1
    }
    Write-Host "Node.js OK: $(node -v)" -ForegroundColor Green
} catch {
    Write-Host "ERRORE: Node.js non trovato. Scaricalo da https://nodejs.org" -ForegroundColor Red; exit 1
}

$rootDir = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "[1/5] Configurazione ambiente..." -ForegroundColor Yellow
$envBackend = Join-Path $rootDir "backend\.env"
$envExample = Join-Path $rootDir ".env.example"
if (-not (Test-Path $envBackend)) {
    Copy-Item $envExample $envBackend
    Write-Host "  → Creato backend\.env — MODIFICA LE CREDENZIALI!" -ForegroundColor Yellow
} else {
    Write-Host "  → backend\.env già esistente"
}

Write-Host ""
Write-Host "[2/5] Installazione dipendenze backend..." -ForegroundColor Yellow
Set-Location (Join-Path $rootDir "backend")
npm install

Write-Host ""
Write-Host "[3/5] Installazione dipendenze frontend..." -ForegroundColor Yellow
Set-Location (Join-Path $rootDir "frontend")
npm install

Write-Host ""
Write-Host "[4/5] Migrazione database..." -ForegroundColor Yellow
Set-Location (Join-Path $rootDir "backend")
npm run db:migrate

Write-Host ""
Write-Host "[5/5] Seed dati iniziali..." -ForegroundColor Yellow
npm run db:seed

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Installazione completata!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Avvio backend:  cd backend; npm run dev"
Write-Host "Avvio frontend: cd frontend; npm run dev"
Write-Host ""
Write-Host "Credenziali demo:" -ForegroundColor Cyan
Write-Host "  Admin:   admin / Admin@2024!"
Write-Host "  Utente:  marco / User@2024!"
Write-Host ""
Write-Host "URL: http://localhost:5173" -ForegroundColor Cyan
