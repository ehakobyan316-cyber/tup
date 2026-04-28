@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo Ազատում եմ պորտ 3000-ը...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Սպանում եմ պրոցես %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo Ստուգում եմ կախվածությունները...
if not exist "node_modules\express" (
    echo Տեղադրում եմ կախվածությունները...
    cmd /c "npm install"
)

echo Գործարկում եմ սերվերը...
node server.js
pause
