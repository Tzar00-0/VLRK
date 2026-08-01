@echo off
title Menjalankan VLRK - VL Reservasi Kelas
echo =======================================================
echo   🏫 MEMULAI SISTEM VLRK (VL RESERVASI KELAS)
echo =======================================================
echo.

:: Pindah ke folder tempat file batch ini berada
cd /d "%~dp0"

echo [1/3] Menjalankan Server Backend...
start /min cmd /c "cd server && npm run dev"

echo [2/3] Menjalankan Server Frontend...
start /min cmd /c "cd client && npm run dev"

echo [3/3] Menunggu server siap (3 detik)...
timeout /t 3 /nobreak >nul

echo Membuka browser default ke http://localhost:5173...
start http://localhost:5173

echo.
echo =======================================================
echo   Sistem VLRK sudah aktif di http://localhost:5173
echo   (Server backend & frontend berjalan di latar belakang)
echo.
echo   Untuk mematikan sistem, silakan tutup jendela cmd
echo   ini atau tutup jendela server yang diminimize.
echo =======================================================
pause
