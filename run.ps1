Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Starting CareerAI Full-Stack Platform..." -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan

$env:PATH = "C:\Users\Ranjith\.local\bin;C:\Users\Ranjith\.local\node;" + $env:PATH

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\job tracker\backend'; .\venv\Scripts\activate; uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\job tracker\frontend'; npx vite --port 5174 --host"

Write-Host "Frontend: http://localhost:5174" -ForegroundColor Yellow
Write-Host "Backend Docs: http://localhost:8000/docs" -ForegroundColor Yellow