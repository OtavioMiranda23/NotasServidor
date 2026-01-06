@echo off
setlocal EnableExtensions

REM Vai para a raiz do projeto (um nível acima de dist)
pushd "%~dp0\.."

echo ====================================
echo Iniciando pdfGenerator...
echo Working dir: %CD%
echo ====================================

REM Verifica se o arquivo compilado existe
if not exist ".\dist\index.js" (
    echo Arquivo .\dist\index.js nao encontrado!
    echo Executando build primeiro...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo Falha no build! (%ERRORLEVEL%)
        popd
        exit /b %ERRORLEVEL%
    )
)

REM Executa o index.js compilado (agora o process.cwd() aponta para a raiz, onde existe .env)
node ".\dist\index.js"

set EXITCODE=%ERRORLEVEL%

echo ====================================
echo Processo finalizado (exitcode=%EXITCODE%)
echo ====================================

popd
exit /b %EXITCODE%