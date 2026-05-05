@echo off
chcp 65001 >nul
echo 正在上传修改的文件到云服务器...
echo.

set SERVER=root@43.160.201.4
set REMOTE_DIR=/root/心宇宙重塑：房树人图像趣测

echo 上传 puzzle_engine.js...
scp puzzle_engine.js %SERVER%:%REMOTE_DIR%/
if %errorlevel% neq 0 (
    echo 上传 puzzle_engine.js 失败！
    pause
    exit /b 1
)

echo 上传 index.html...
scp index.html %SERVER%:%REMOTE_DIR%/
if %errorlevel% neq 0 (
    echo 上传 index.html 失败！
    pause
    exit /b 1
)

echo.
echo 文件上传完成！
echo 正在重启服务...
echo.

ssh %SERVER% "cd /root/心宇宙重塑：房树人图像趣测 && pm2 restart all"

echo.
echo 部署完成！
pause
