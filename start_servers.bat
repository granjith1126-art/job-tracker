@echo off
title CareerAI Server Launcher
echo ====================================================
echo Starting CareerAI Full-Stack Platform...
echo ====================================================

set "PATH=C:\Users\Ranjith\.local\bin;C:\Users\Ranjith\.local\node;%PATH%"

echo Starting FastAPI Backend on http://localhost:8000 ...
start "CareerAI Backend (FastAPI)" cmd /k "cd /d D:\job tracker\backend && ..\backend\.venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 >nul

echo Starting React Frontend on http://localhost:5173 ...
start "CareerAI Frontend (Vite)" cmd /k "cd /d D:\job tracker\frontend && npx vite --port 5173 --host"

echo ====================================================
echo Application is running!
echo Frontend: http://localhost:5173
echo Backend API & Docs: http://localhost:8000/docs
echo ====================================================
pause