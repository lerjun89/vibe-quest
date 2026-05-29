@echo off
echo === Build: Settlement Automation Tool ===
echo.

python --version > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python 3.10+ from https://www.python.org
    pause
    exit /b 1
)

if not exist venv (
    echo [1/4] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create venv
        pause
        exit /b 1
    )
)

echo [2/4] Installing packages...
call venv\Scripts\activate.bat
pip install -r requirements.txt -q
if errorlevel 1 (
    echo [ERROR] pip install failed
    pause
    exit /b 1
)

echo [3/4] Building EXE...
pyinstaller --onefile --windowed --name settlement main.py
if errorlevel 1 (
    echo [ERROR] PyInstaller failed
    pause
    exit /b 1
)

echo.
echo [4/4] Done!
echo.
echo  Output: dist\settlement.exe
echo.
echo  Next steps:
echo  1. Copy dist\settlement.exe to your working folder
echo  2. Copy credentials.json to the same folder (see google_setup.txt)
echo  3. Run settlement.exe and click Google Login
echo.
pause
