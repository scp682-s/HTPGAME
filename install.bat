@echo off
echo ========================================
echo Backend Setup
echo ========================================
echo.

echo [1/4] Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)
python --version
echo OK
echo.

echo [2/4] Installing dependencies...
cd backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install
    pause
    exit /b 1
)
echo OK
echo.

echo [3/4] Setting up config...
if not exist .env (
    copy .env.example .env
    echo Created .env file
    echo.
    echo IMPORTANT: Edit backend\.env and add DEEPSEEK_API_KEY
    echo Get API Key from: https://platform.deepseek.com/
    echo.
    notepad .env
    pause
) else (
    echo .env exists
)
echo.

echo [4/4] Starting server...
python app.py

pause
