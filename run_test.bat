@echo off
REM Run this batch file to set up and test the C++ project with the SQLite database

REM Step 1: Populate or update the database
sqlite3 moon_lander.db < populate_db.sql

REM Step 2: Compile the C++ code (requires g++)
g++ -o main.exe CPP\main.cpp CPP\sqlite3.c
if errorlevel 1 (
    echo Compilation failed.
    exit /b 1
)

REM Step 3: Run the compiled program
main.exe
