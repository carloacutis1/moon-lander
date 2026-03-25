
#include <cmath>
#include <iostream>
#include "sqlite3.h"

constexpr double G{ 6.67430E-11 };
constexpr double MOON_RADIUS{ 1738.1 };
constexpr long EMPTY_LANDER_MASS{ 450000 };
constexpr unsigned STARTING_FUEL_MASS{ 2000 };
constexpr unsigned STARTING_HEIGHT{ 200000 };
constexpr unsigned long THRUST_REQUIRED_FUEL_MASS{ 10 };
constexpr unsigned long THRUST_NEWTONS{ 300000000 };
constexpr double MOON_MASS{ 10.346E22 };
constexpr unsigned DELTA_T{ 1 };

struct LanderData {
    unsigned long fuelMass;
    long height;
    long velocity;
    bool thrustersActivated;
};

void printDebugInfo(const LanderData& data, const std::string& label) {
    const unsigned long totalMass{ data.fuelMass + EMPTY_LANDER_MASS };
    const long startingMass{ EMPTY_LANDER_MASS + STARTING_FUEL_MASS };
    std::cout << "[" << label << "]\n";
    std::cout << "Mass : " << totalMass << " / " << startingMass << '\n';
    const unsigned long fuelPercentage{ 100 * data.fuelMass / STARTING_FUEL_MASS };
    std::cout << "Fuel : " << fuelPercentage << "%\n";
    std::cout << "Height : " << data.height << '\n';
    std::cout << "Velocity : " << data.velocity << '\n';
    std::cout << "Thrusters Activated? : " << data.thrustersActivated << "\n\n";
}

// Read lander data from a table (currentdata or previousdata)
LanderData readDB(sqlite3* db, const char* table) {
    LanderData data{};
    std::string sql = std::string("SELECT fuelMass, height, velocity, thrustersActivated FROM ") + table + " WHERE id=1;";
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            data.fuelMass = sqlite3_column_int(stmt, 0);
            data.height = sqlite3_column_int(stmt, 1);
            data.velocity = sqlite3_column_int(stmt, 2);
            data.thrustersActivated = sqlite3_column_int(stmt, 3);
        }
    }
    sqlite3_finalize(stmt);
    return data;
}

// Write lander data to a table (currentdata or previousdata)
void writeDB(sqlite3* db, const char* table, const LanderData& data) {
    std::string sql = std::string("UPDATE ") + table + " SET fuelMass=?, height=?, velocity=?, thrustersActivated=? WHERE id=1;";
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
        sqlite3_bind_int(stmt, 1, data.fuelMass);
        sqlite3_bind_int(stmt, 2, data.height);
        sqlite3_bind_int(stmt, 3, data.velocity);
        sqlite3_bind_int(stmt, 4, data.thrustersActivated);
        sqlite3_step(stmt);
    }
    sqlite3_finalize(stmt);
}

void updateLanderState(sqlite3* db, bool thrustersActivated) {
    // Copy currentdata to previousdata
    LanderData current = readDB(db, "currentdata");
    writeDB(db, "previousdata", current);

    // Update currentdata using the algorithm
    LanderData previousData = current;
    LanderData newCurrent = previousData;
    newCurrent.thrustersActivated = thrustersActivated;
    newCurrent.fuelMass = previousData.fuelMass - previousData.thrustersActivated * THRUST_REQUIRED_FUEL_MASS;
    const unsigned long previousLanderMass{ previousData.fuelMass + EMPTY_LANDER_MASS };
    const double moonGravity{ G * MOON_MASS / pow(MOON_RADIUS + previousData.height, 2) };
    const double netForce{ moonGravity * previousLanderMass - previousData.thrustersActivated * THRUST_NEWTONS };
    double acceleration{ netForce / (previousLanderMass - previousData.thrustersActivated * THRUST_REQUIRED_FUEL_MASS * 0.5) };
    newCurrent.height = previousData.height - previousData.velocity * DELTA_T - acceleration * 0.5 * pow(DELTA_T, 2);
    newCurrent.velocity = previousData.velocity + acceleration * DELTA_T;
    if (previousData.thrustersActivated) {
        newCurrent.fuelMass -= THRUST_REQUIRED_FUEL_MASS;
    }
    writeDB(db, "currentdata", newCurrent);
}

void printLanderTables(sqlite3* db) {
    LanderData current = readDB(db, "currentdata");
    LanderData previous = readDB(db, "previousdata");
    printDebugInfo(previous, "Previous Data");
    printDebugInfo(current, "Current Data");
}

// Reset both tables to default values
void resetLanderTables(sqlite3* db) {
    LanderData defaultData{2000, 200000, 0, 0};
    writeDB(db, "currentdata", defaultData);
    writeDB(db, "previousdata", defaultData);
}
