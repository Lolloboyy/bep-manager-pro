@echo off
cd /d "%~dp0"
echo.
echo  BEP MANAGER PRO - AVVIO FRONTEND
echo.
if not exist node_modules (
  echo Installazione delle dipendenze...
  call npm.cmd install
  if errorlevel 1 goto error
)
echo Avvio di Vite...
call npm.cmd run dev
goto end
:error
echo.
echo ERRORE: installazione o avvio non riuscito. Verifica Node.js e npm.
pause
:end
