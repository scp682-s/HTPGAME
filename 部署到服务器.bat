@echo off
chcp 65001 >nul
echo ========================================
echo   房树人项目 - 上传到腾讯云服务器
echo ========================================
echo.

REM 配置区域 - 请修改为你的服务器信息
set SERVER_IP=你的服务器IP
set SERVER_USER=root
set SERVER_PATH=/root/htpgame

echo [提示] 请先修改此脚本中的服务器配置信息
echo.
echo 当前配置:
echo   服务器IP: %SERVER_IP%
echo   用户名: %SERVER_USER%
echo   目标路径: %SERVER_PATH%
echo.

pause

echo.
echo [1/3] 检查 SSH 连接...
ssh %SERVER_USER%@%SERVER_IP% "echo SSH 连接成功"
if errorlevel 1 (
    echo [错误] SSH 连接失败，请检查:
    echo   1. 服务器 IP 是否正确
    echo   2. 是否已配置 SSH 密钥或密码
    echo   3. 服务器是否开放 22 端口
    pause
    exit /b 1
)

echo.
echo [2/3] 上传项目文件...
echo 正在上传，请稍候...

REM 排除不需要上传的文件
scp -r ^
    -o "StrictHostKeyChecking=no" ^
    --exclude=node_modules ^
    --exclude=.git ^
    --exclude=data/*.db ^
    --exclude=logs ^
    --exclude=unpacked* ^
    --exclude=文档 ^
    ./* %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/

if errorlevel 1 (
    echo [错误] 文件上传失败
    pause
    exit /b 1
)

echo [成功] 文件上传完成

echo.
echo [3/3] 在服务器上执行部署...
ssh %SERVER_USER%@%SERVER_IP% "cd %SERVER_PATH% && chmod +x 快速部署.sh && ./快速部署.sh"

if errorlevel 1 (
    echo [警告] 自动部署失败，请手动执行以下命令:
    echo   ssh %SERVER_USER%@%SERVER_IP%
    echo   cd %SERVER_PATH%
    echo   ./快速部署.sh
) else (
    echo.
    echo ========================================
    echo   部署完成！
    echo ========================================
    echo.
    echo 访问地址: http://%SERVER_IP%:3001
    echo.
    echo 如果无法访问，请:
    echo   1. 登录腾讯云控制台
    echo   2. 进入防火墙设置
    echo   3. 添加规则: TCP 端口 3001
)

echo.
pause
