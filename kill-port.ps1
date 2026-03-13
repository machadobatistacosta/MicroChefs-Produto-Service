# Script para matar processo na porta 3002
param(
    [int]$Port = 3002
)

Write-Host "[*] Procurando processo na porta $Port..." -ForegroundColor Cyan

$process = netstat -ano | Select-String ":$Port" | Select-Object -First 1
if ($process) {
    $processId = ($process -split '\s+')[-1]
    Write-Host "[!] Encontrado PID: $processId" -ForegroundColor Yellow
    
    try {
        Stop-Process -Id $processId -Force -ErrorAction Stop
        Write-Host "[OK] Processo $processId eliminado com sucesso!" -ForegroundColor Green
        Start-Sleep -Seconds 1
        Write-Host "[+] Porta $Port liberada!" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Erro ao matar processo: $_" -ForegroundColor Red
    }
} else {
    Write-Host "[OK] Nenhum processo encontrado na porta $Port" -ForegroundColor Green
}
