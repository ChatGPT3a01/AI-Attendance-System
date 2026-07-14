@echo off
echo =======================================
echo      到班打卡系統 - 系統啟動中
echo =======================================
echo.

REM 檢查Python是否安裝
python --version >nul 2>&1
if errorlevel 1 (
    echo 錯誤：未找到Python，請先安裝Python 3.7或更高版本
    pause
    exit /b 1
)

echo 正在檢查依賴套件...
pip install -r requirements.txt

echo.
echo 正在啟動系統...
echo 系統將在 http://localhost:5000 運行
echo 按 Ctrl+C 可停止系統
echo.

cd backend
python app.py

pause