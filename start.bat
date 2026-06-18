@echo off
setlocal

set ROOT_DIR=%~dp0
set BACKEND_DIR=%ROOT_DIR%backend
set BACKEND_VENV=%BACKEND_DIR%\.venv

echo Preparing backend...
cd /d "%BACKEND_DIR%"

if not exist "%BACKEND_VENV%\Scripts\python.exe" (
  where py >nul 2>nul
  if %errorlevel%==0 (
    py -3 -m venv "%BACKEND_VENV%"
  ) else (
    python -m venv "%BACKEND_VENV%"
  )
)

call "%BACKEND_VENV%\Scripts\activate.bat"
python -m pip install -r requirements.txt
python reset_users.py

echo Preparing frontend...
cd /d "%ROOT_DIR%"
npm install

echo.
echo 外國學生招生審查平台
echo Frontend URL: http://localhost:3000
echo Backend port: 5006
echo.
echo Login accounts:
echo   admin / admin123
echo   teacher01 / 123456
echo   teacher02 / 123456
echo.

start "Admission Backend - Port 5006" cmd /k "cd /d "%BACKEND_DIR%" && call "%BACKEND_VENV%\Scripts\activate.bat" && python run.py"
start "Admission Frontend - Port 3000" cmd /k "cd /d "%ROOT_DIR%" && npm start"

endlocal
