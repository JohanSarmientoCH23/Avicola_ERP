@echo off
chcp 65001 >nul
title Avicola ERP - Iniciar Todos los Servicios
echo ============================================
echo   AVICOLA ERP - Iniciando Sistema
echo ============================================
echo.

echo [1/3] Iniciando Docker (PostgreSQL + MinIO)...
cd /d "%~dp0"
docker compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Docker no pudo iniciar. Verifique que Docker Desktop este corriendo.
    pause
    exit /b 1
)
echo OK: Docker iniciado.
echo.

echo [2/3] Iniciando Backend (NestJS en puerto 3001)...
cd /d "%~dp0apps\backend"
start "Avicola Backend" cmd /c "npx nest start --watch"
echo OK: Backend iniciado en segundo plano.
echo.

echo [3/3] Iniciando Frontend (Next.js en puerto 3000)...
cd /d "%~dp0apps\frontend"
start "Avicola Frontend" cmd /c "npx next dev"
echo OK: Frontend iniciado en segundo plano.
echo.

echo ============================================
echo   TODOS LOS SERVICIOS INICIADOS
echo ============================================
echo.
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:3001
echo   Swagger:   http://localhost:3001/api/docs
echo   MinIO:     http://localhost:9001
echo.
echo   Credenciales:
echo   admin@avicola.com / password123
echo.
echo   Para apagar todo, ejecuta: APAGAR.bat
echo ============================================
echo.
pause
