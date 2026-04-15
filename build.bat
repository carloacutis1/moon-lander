:: Build script for Moon Lander on Windows
:: This assumes you have MinGW (g++) installed

@echo off
setlocal enabledelayedexpansion

echo Building Moon Lander...
cd /d "%~dp0CPP"

:: Check for compiler
where g++ >nul 2>nul
if %errorlevel% equ 0 (
    echo Found MinGW/g++
    
    :: Compile sqlite3.c as C
    echo Compiling SQLite...
    gcc -c sqlite3.c -o sqlite3.o
    
    :: Compile and link main.cpp + demo.cpp
    echo Compiling main...
    g++ -std=c++17 -o lander.exe main.cpp demo.cpp sqlite3.o -lpthread
    
    if %errorlevel% equ 0 (
        echo.
        echo Build successful!
        echo To run: cd CPP ^&^& lander.exe
    ) else (
        echo Build failed!
    )
) else (
    echo ERROR: No C++ compiler found
    echo.
    echo Options:
    echo 1. Install MinGW-w64: https://www.mingw-w64.org/
    echo 2. Install MSYS2: https://www.msys2.org/ then run: pacman -S mingw-w64-x86_64-gcc
    echo 3. Use WSL: wsl --install, then apt install build-essential
    pause
)
