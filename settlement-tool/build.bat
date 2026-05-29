@echo off
chcp 65001 > nul
echo === 정산 자동화 도구 빌드 ===
echo.

REM Python 존재 확인
python --version > nul 2>&1
if errorlevel 1 (
    echo [오류] Python이 설치되지 않았습니다.
    echo https://www.python.org 에서 Python 3.10 이상을 설치하세요.
    pause
    exit /b 1
)

REM 가상환경 생성 (없으면)
if not exist venv (
    echo [1/4] 가상환경 생성 중...
    python -m venv venv
    if errorlevel 1 (
        echo [오류] 가상환경 생성 실패
        pause
        exit /b 1
    )
)

echo [2/4] 패키지 설치 중...
call venv\Scripts\activate.bat
pip install -r requirements.txt -q
if errorlevel 1 (
    echo [오류] 패키지 설치 실패
    pause
    exit /b 1
)

echo [3/4] EXE 빌드 중...

REM credentials.json 이 있으면 번들에 포함, 없으면 제외
if exist credentials.json (
    pyinstaller --onefile --windowed --name "정산자동화" --add-data "credentials.json;." main.py
) else (
    pyinstaller --onefile --windowed --name "정산자동화" main.py
    echo.
    echo [주의] credentials.json 이 없습니다.
    echo       EXE 실행 전 반드시 credentials.json 을 dist 폴더 안에 넣어주세요.
    echo       발급 방법은 google_setup.txt 를 참고하세요.
)

if errorlevel 1 (
    echo [오류] EXE 빌드 실패
    pause
    exit /b 1
)

echo.
echo [4/4] 완료!
echo.
echo ┌─────────────────────────────────────────────┐
echo │ 사용 방법                                   │
echo │                                             │
echo │ 1. dist\정산자동화.exe 를 원하는 폴더로 이동│
echo │ 2. credentials.json 을 같은 폴더에 복사     │
echo │    (google_setup.txt 참고)                  │
echo │ 3. 프로그램 실행 후 Google 로그인 버튼 클릭 │
echo └─────────────────────────────────────────────┘
echo.
pause
