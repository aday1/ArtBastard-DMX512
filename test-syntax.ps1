# Test the specific problematic area
function Build-Project([bool]$BackendOnly) {
        Write-Host "COMPILING BACKEND MYSTICAL ENERGIES..." -ForegroundColor Cyan
        npm run build-backend
        Write-Host "BACKEND SUCCESSFULLY CRYSTALLIZED INTO PURE EXECUTABLE FORM!" -ForegroundColor Green

        if(-not $BackendOnly) {
                Write-Host "MANIFESTING FRONTEND VISUAL SPECTACLE..." -ForegroundColor Blue
                Set-Location react-app
                
                npm run build
                
                if($LASTEXITCODE -ne 0) {
                        Write-Host "Standard build failed, attempting JavaScript fallback..." -ForegroundColor Yellow
                        npm run build:js-fallback
                        
                        if($LASTEXITCODE -ne 0) {
                                Write-Host "Both native and JS fallback builds failed!" -ForegroundColor Red
                                Set-Location ..
                                throw "Frontend build failed with both native and JavaScript fallback methods"
                        } else {
                                Write-Host "JavaScript fallback build succeeded!" -ForegroundColor Green
                        }
                } else {
                        Write-Host "Native build succeeded!" -ForegroundColor Green
                }
                
                Set-Location ..
                Write-Host "FRONTEND TRANSFORMED INTO BEAUTIFUL STATIC ARTWORK!" -ForegroundColor Green
        } else {
                Write-Host "Backend-only mode: Frontend remains in its raw, dynamic state!" -ForegroundColor DarkGray
        }

        Write-Host ""
        Write-Host "THE DIGITAL MASTERPIECE IS COMPLETE AND READY TO ILLUMINATE THE WORLD!" -ForegroundColor Green -BackgroundColor Black
        Write-Host ""
}

Write-Host "Test script syntax check"
