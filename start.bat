@echo off
setlocal
title Mad Quest

cd /d "%~dp0"

set "PATH=%PATH%;%ProgramFiles%\nodejs;%ProgramFiles(x86)%\nodejs;%APPDATA%\npm"

where node >nul 2>&1
if errorlevel 1 (
    echo [Ошибка] Node.js не найден. Установите с https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo Устанавливаю зависимости...
    call npm install
    if errorlevel 1 (
        echo [Ошибка] Не удалось установить зависимости.
        pause
        exit /b 1
    )
)

echo.
echo Запускаю приложение...
echo Открой в браузере: http://localhost:5173/mad-quest/
echo Для остановки нажми Ctrl+C
echo.

call npm run dev

echo.
echo Сервер остановлен.
pause