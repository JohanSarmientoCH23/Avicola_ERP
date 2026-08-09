@echo off
chcp 65001 >nul
title Avicola ERP - Apagar Todos los Servicios
echo ============================================
echo   AVICOLA ERP - Apagando Sistema
echo ============================================
echo.

echo [1/3] Deteniendo Frontend (Next.js)...
taskkill /FI "WINDOWTITLE eq Avicola Frontend*" /F >nul 2>&1
taskkill /FI "IMAGENAME eq node.exe" /FI "WINDOWTITLE eq *next*" /F >nul 2>&1
echo OK: Frontend detenido.

echo [2/3] Deteniendo Backend (NestJS)...
taskkill /FI "WINDOWTITLE eq Avicola Backend*" /F >nul 2>&1
echo OK: Backend detenido.

echo [3/3] Deteniendo Docker (PostgreSQL + MinIO)...
cd /d "%~dp0"
docker compose down
echo OK: Docker detenido.

echo.
echo ============================================
echo   TODOS LOS SERVICIOS APAGADOS
echo ============================================
echo.
pause
