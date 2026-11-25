@echo off
cd /d "%~dp0"
start "BEP Manager Pro - Backend Java" cmd /k "call backend\start-backend.cmd"
start "BEP Manager Pro - Frontend React" cmd /k "call frontend\start-frontend.cmd"
echo.
echo I due server si stanno avviando in finestre separate.
echo Attendi che entrambi siano pronti, poi apri http://localhost:5173
pause
