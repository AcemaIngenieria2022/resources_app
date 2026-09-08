@echo off
setlocal

rem ============================================================
rem ENVIO AUTOMATICO DE REPORTE PDF
rem ============================================================

rem Ir a la raiz del proyecto
pushd "%~dp0\..\.."

if errorlevel 1 (
    echo [%date% %time%] ERROR: No se pudo acceder a la raiz del proyecto.
    exit /b 1
)

rem Ruta de Node.js
set "NODE_EXE=C:\Program Files\nodejs\node.exe"

if not exist "%NODE_EXE%" (
    echo [%date% %time%] ERROR: No se encontro Node.js en:
    echo %NODE_EXE%
    popd
    exit /b 1
)

rem Obtener fecha del reporte
if not "%~1"=="" (
    set "REPORT_DATE=%~1"
) else (
    for /f %%D in ('powershell -NoProfile -Command "(Get-Date).AddDays(-1).ToString('yyyy-MM-dd')"') do set "REPORT_DATE=%%D"
)

echo ============================================================
echo [%date% %time%] Enviando reporte del: %REPORT_DATE%
echo ============================================================

"%NODE_EXE%" "scripts\reports\send.js" "%REPORT_DATE%"

set "EXIT_CODE=%ERRORLEVEL%"

if "%EXIT_CODE%"=="0" (
    echo [%date% %time%] REPORTE ENVIADO CORRECTAMENTE.
) else (
    echo [%date% %time%] ERROR AL ENVIAR EL REPORTE. Codigo: %EXIT_CODE%
)

popd

exit /b %EXIT_CODE%