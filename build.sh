#!/bin/bash
# Build script for Moon Lander on macOS/Linux

echo "Building Moon Lander..."

cd "$(dirname "$0")/CPP" || exit 1

# Compile sqlite3.c as C
echo "Compiling SQLite..."
cc -c sqlite3.c -o sqlite3.o

# Compile and link main.cpp + demo.cpp
echo "Compiling main..."
clang++ -std=c++17 -o lander main.cpp demo.cpp sqlite3.o -lpthread -ldl

if [ $? -eq 0 ]; then
    echo ""
    echo "Build successful!"
    echo "To run: cd CPP && ./lander"
else
    echo ""
    echo "Build failed!"
    exit 1
fi
