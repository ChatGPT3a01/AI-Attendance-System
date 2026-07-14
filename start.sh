#!/bin/bash

echo "======================================="
echo "     到班打卡系統 - 系統啟動中"
echo "======================================="
echo

# 檢查Python是否安裝
if ! command -v python3 &> /dev/null; then
    echo "錯誤：未找到Python，請先安裝Python 3.7或更高版本"
    exit 1
fi

echo "正在檢查依賴套件..."
pip3 install -r requirements.txt

echo
echo "正在啟動系統..."
echo "系統將在 http://localhost:5000 運行"
echo "按 Ctrl+C 可停止系統"
echo

cd backend
python3 app.py