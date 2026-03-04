# C++ Compilation Setup for Moon Lander

## Current Status
✓ Database created: `moon_lander.db`
✓ Database populated with lander and constants data
✓ C++ code ready with SQLite integration

## What You Need

Your C++ code requires:
- A C++ compiler (g++, clang, or MSVC)
- SQLite3 development libraries

## Option 1: Using WSL (Windows Subsystem for Linux) - RECOMMENDED

WSL gives you full Linux toolchain on Windows. Run in PowerShell:

```powershell
# Enable WSL (one time)
wsl --install

# In WSL terminal, install build tools:
sudo apt update
sudo apt install build-essential sqlite3 libsqlite3-dev

# Navigate to project
cd /mnt/c/Users/gusjo_lw96ve5/OneDrive/Desktop/moon-lander

# Build
g++ -std=c++17 CPP -o lander -lsqlite3

# Run
./lander
```

## Option 2: MinGW on Windows (Direct)

1. Download MinGW-w64: https://www.mingw-w64.org/
2. Install to `C:\mingw64` (or add to PATH if installed elsewhere)
3. Download SQLite3 amalgamation from https://www.sqlite.org/download.html
4. In PowerShell:

```powershell
# Compile and link against SQLite3
g++ -std=c++17 CPP -o lander.exe -lsqlite3
./lander.exe
```

## Option 3: Visual Studio (MSVC) - Most Complex

1. Install Visual Studio Community with C++ Desktop Development
2. Download SQLite3 precompiled binaries for Windows
3. Use Visual Studio Developer Command Prompt:

```cmd
cl /std:c++17 CPP sqlite3.lib /link /out:lander.exe
```

## Quickest Path Forward

I recommend **Option 1 (WSL)** because:
- Easiest setup (one command)
- SQLite3 libraries already available
- Most developers use this
- Same tooling as production Linux servers

Let me know which option you'd like to pursue!
