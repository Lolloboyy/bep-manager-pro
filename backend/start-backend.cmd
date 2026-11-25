@echo off
cd /d "%~dp0"
echo.
echo  BEP MANAGER PRO - AVVIO BACKEND JAVA
echo.
where mvn >nul 2>nul
if %errorlevel%==0 (
  call mvn spring-boot:run
  goto end
)
if exist "%~dp0mvnw.cmd" (
  call "%~dp0mvnw.cmd" spring-boot:run
  goto end
)
if exist "%USERPROFILE%\Desktop\tutti i progetti VS code\bep-manager\mvnw.cmd" (
  echo Uso il Maven Wrapper gia presente nel progetto BEP Manager precedente...
  call "%USERPROFILE%\Desktop\tutti i progetti VS code\bep-manager\mvnw.cmd" -f "%~dp0pom.xml" spring-boot:run
  goto end
)
echo Maven non trovato.
echo Se hai ancora la vecchia cartella bep-manager, copia da li i file mvnw.cmd e la cartella .mvn in questa cartella backend.
echo Poi esegui: .\mvnw.cmd spring-boot:run
pause
:end
