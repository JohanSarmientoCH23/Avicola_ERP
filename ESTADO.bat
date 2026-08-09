@echo off
chcp 65001 >nul
title Avicola ERP - Verificar Estado
echo ============================================
echo   AVICOLA ERP - Estado del Sistema
echo ============================================
echo.

echo [Docker]
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>nul || echo Docker no esta corriendo.
echo.

echo [Backend - Puerto 3001]
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo Backend: CORRIENDO
) else (
    echo Backend: DETENIDO
)
echo.

echo [Frontend - Puerto 3000]
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo Frontend: CORRIENDO
) else (
    echo Frontend: DETENIDO
)
echo.

echo [MinIO - Puerto 9001]
netstat -ano | findstr ":9001" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo MinIO: CORRIENDO
) else (
    echo MinIO: DETENIDO
)
echo.
pause
