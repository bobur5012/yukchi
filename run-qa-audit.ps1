# Yukchi QA Audit Runner
# This script installs dependencies and runs the comprehensive QA audit

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "         YUKCHI WEB APP - QA AUDIT RUNNER" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Playwright is installed
Write-Host "Checking for Playwright..." -ForegroundColor Yellow
$playwrightInstalled = Test-Path "node_modules/@playwright/test"

if (-not $playwrightInstalled) {
    Write-Host "Playwright not found. Installing..." -ForegroundColor Yellow
    npm install -D @playwright/test
    
    Write-Host "Installing browser binaries..." -ForegroundColor Yellow
    npx playwright install
} else {
    Write-Host "✓ Playwright already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "Starting QA Audit..." -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing URL: https://yukchi.netlify.app" -ForegroundColor White
Write-Host "Credentials: Phone: 901234567, Password: admin123" -ForegroundColor White
Write-Host ""

# Run the audit
npx playwright test qa-audit.spec.ts --headed

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "Audit Complete!" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Results saved to:" -ForegroundColor Yellow
Write-Host "  - qa-audit-report.json (detailed JSON report)" -ForegroundColor White
Write-Host "  - qa-audit-screenshots/ (all screenshots)" -ForegroundColor White
Write-Host ""
Write-Host "To view HTML report, run:" -ForegroundColor Yellow
Write-Host "  npx playwright show-report" -ForegroundColor White
Write-Host ""
