@echo off
chcp 65001 >nul

REM 配置区域 - 请修改为你的服务器信息
set SERVER_IP=你的服务器IP
set SERVER_USER=root
set SERVER_PATH=/root/htpgame

echo ========================================
echo   SSH 连接到腾讯云服务器
echo ========================================
echo.
echo 服务器: %SERVER_USER%@%SERVER_IP%
echo 项目路径: %SERVER_PATH%
echo.

REM 检查是否安装了 SSH 客户端
where ssh >nul 2>nul
if errorlevel 1 (
    echo [错误] 未找到 SSH 客户端
    echo.
    echo 请安装 OpenSSH 客户端:
    echo   1. 打开 "设置" - "应用" - "可选功能"
    echo   2. 点击 "添加功能"
    echo   3. 搜索并安装 "OpenSSH 客户端"
    echo.
    echo 或使用 PuTTY 等 SSH 工具
    pause
    exit /b 1
)

echo 正在连接...
echo.
ssh %SERVER_USER%@%SERVER_IP% -t "cd %SERVER_PATH% && bash"

pause
