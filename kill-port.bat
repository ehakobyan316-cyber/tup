@echo off
chcp 65001 >nul

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Սպանում եմ պրոցես %%a (օգտագործում էր պորտ 3000)...
    taskkill /F /PID %%a >nul 2>&1
)

echo Պորտ 3000 ազատված է։
