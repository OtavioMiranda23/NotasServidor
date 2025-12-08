@echo off
echo ====================================
echo Iniciando pdfGenerator...
echo ====================================

REM Verifica se o arquivo compilado existe
if not exist ".\index.js" (
    echo Arquivo .\index.js nao encontrado!
    echo Executando build primeiro...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo Falha no build!
        pause
        exit /b %ERRORLEVEL%
    )
)

REM Executa o index.js compilado
node .\index.js

echo ====================================
echo Processo finalizado
echo ====================================
pause