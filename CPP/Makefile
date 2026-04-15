# Cross-platform Makefile for Moon Lander
# Works on Windows (MinGW/MSYS2), macOS, and Linux

# Compiler settings
CXX = g++
CC = cc
CXXFLAGS = -std=c++17 -Wall -Wextra
LDFLAGS = -lpthread

# Platform detection
ifeq ($(OS),Windows_NT)
    TARGET = lander.exe
    LDFLAGS += 
    RM = del /Q
else
    UNAME_S := $(shell uname -s)
    TARGET = lander
    LDFLAGS += -ldl
    RM = rm -f
endif

# Source files
SOURCES = main.cpp demo.cpp
SQLITE_OBJ = sqlite3.o

# Default target
all: $(TARGET)

# Build sqlite3 as C (not C++)
sqlite3.o: sqlite3.c sqlite3.h
	$(CC) -c sqlite3.c -o sqlite3.o

# Build main executable
$(TARGET): $(SOURCES) $(SQLITE_OBJ) demo.h
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SOURCES) $(SQLITE_OBJ) $(LDFLAGS)

# Run the program
run: $(TARGET)
	./$(TARGET)

# Clean build artifacts
clean:
	$(RM) $(TARGET) $(SQLITE_OBJ)

.PHONY: all clean run
