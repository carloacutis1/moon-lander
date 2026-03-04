:: Build script for Moon Lander on Windows
:: This assumes you have MinGW or Visual Studio installed

@echo off
setlocal enabledelayedexpansion

:: Check for compiler
where g++ >nul 2>nul
if %errorlevel% equ 0 (
    echo Found MinGW/g++
    g++ -std=c++17 CPP -o lander.exe -lsqlite3
    if %errorlevel% equ 0 (
        echo Build successful! Run: lander.exe
    ) else (
        echo Build failed - try installing sqlite3 dev package
    )
) else (
    echo ERROR: No C++ compiler found
    echo.
    echo Options:
    echo 1. Install MinGW: https://www.mingw-w64.org/
    echo 2. Install Visual Studio Community with C++ support
    echo 3. Use WSL (Windows Subsystem for Linux) with apt install build-essential sqlite3 libsqlite3-dev
    pause
)
