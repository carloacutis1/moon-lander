#pragma once
#include "sqlite3.h"
#include <string>

// Lander state structure - shared on the blackboard
struct LanderData {
    unsigned long fuelMass;
    long height;
    long velocity;
    bool thrustersActivated;
};

// Initialize blackboard tables in database
void initBlackboard(sqlite3* db);

// Knowledge Source 1: Sensor - Read state from blackboard
LanderData readDB(sqlite3* db, const char* table);

// Knowledge Source 2: Actuator - Write state to blackboard
void writeDB(sqlite3* db, const char* table, const LanderData& data);

// Knowledge Source 3: Physics Calculator - Compute and update state
void updateLanderState(sqlite3* db, bool thrustersActivated);

// Knowledge Source 4: Display - Read and show telemetry
void printLanderTables(sqlite3* db);

void resetLanderTables(sqlite3* db);
