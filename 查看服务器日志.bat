@echo off
chcp 65001 >nul

REM 配置区域 - 请修改为你的服务器信息
set SERVER_IP=你的服务器IP
set SERVER_USER=root

echo ========================================
echo   查看服务器日志
echo ========================================
echo.

:menu
echo 请选择操作:
echo   1. 查看实时日志
echo   2. 查看最近 50 行日志
echo   3. 查看错误日志
echo   4. 查看 pm2 状态
echo   5. 运行故障排查
echo   0. 退出
echo.
set /p choice=请输入选项 (0-5):

if "%choice%"=="1" goto realtime
if "%choice%"=="2" goto recent
if "%choice%"=="3" goto errors
if "%choice%"=="4" goto status
if "%choice%"=="5" goto diagnose
if "%choice%"=="0" exit /b 0

echo 无效选项，请重新选择
echo.
goto menu

:realtime
echo.
echo [实时日志] 按 Ctrl+C 退出
echo.
ssh %SERVER_USER%@%SERVER_IP% "pm2 logs http-backend"
goto menu

:recent
echo.
echo [最近 50 行日志]
echo.
ssh %SERVER_USER%@%SERVER_IP% "pm2 logs http-backend --lines 50 --nostream"
echo.
pause
goto menu

:errors
echo.
echo [错误日志]
echo.
ssh %SERVER_USER%@%SERVER_IP% "pm2 logs http-backend --err --lines 50 --nostream"
echo.
pause
goto menu

:status
echo.
echo [PM2 状态]
echo.
ssh %SERVER_USER%@%SERVER_IP% "pm2 status && echo. && pm2 show http-backend"
echo.
pause
goto menu

:diagnose
echo.
echo [运行故障排查]
echo.
ssh %SERVER_USER%@%SERVER_IP% "cd /root/htpgame && ./故障排查.sh"
echo.
pause
goto menu
