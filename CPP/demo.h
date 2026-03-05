#pragma once
#include "sqlite3.h"
#include <string>

struct LanderData {
    unsigned long fuelMass;
    long height;
    long velocity;
    bool thrustersActivated;
};

LanderData readDB(sqlite3* db, const char* table);
void writeDB(sqlite3* db, const char* table, const LanderData& data);
void updateLanderState(sqlite3* db, bool thrustersActivated);
void printLanderTables(sqlite3* db);
