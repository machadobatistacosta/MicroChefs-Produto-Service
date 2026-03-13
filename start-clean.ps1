# Script para iniciar o servidor limpo
Write-Host "[*] Matando processo anterior na porta 3002..." -ForegroundColor Yellow
& .\kill-port.ps1

Write-Host "`n[*] Iniciando servidor..." -ForegroundColor Cyan
npm start
