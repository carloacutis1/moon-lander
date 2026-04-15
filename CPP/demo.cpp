// demo.cpp - Blackboard Architecture Implementation
// Knowledge sources that read/write to the SQLite blackboard

#include "demo.h"
#include "sqlite3.h"
#include <iostream>
#include <cmath>
#include <string>

// Physics constants (matching equations.txt)
constexpr double G = 6.67430e-11;           // Gravitational constant
constexpr double MOON_MASS = 7.342e22;      // kg
constexpr double MOON_RADIUS = 1737400.0;   // meters
constexpr double THRUST_FORCE = 4500.0;     // Newtons (from landers table)
constexpr double BURN_RATE = 1.2;           // kg/s fuel consumption
constexpr double DELTA_T = 1.0;             // Time step in seconds

// Helper: Execute SQL and print errors
static bool execSQL(sqlite3* db, const char* sql) {
    char* errMsg = nullptr;
    int rc = sqlite3_exec(db, sql, nullptr, nullptr, &errMsg);
    if (rc != SQLITE_OK) {
        std::cerr << "SQL error: " << errMsg << std::endl;
        sqlite3_free(errMsg);
        return false;
    }
    return true;
}

// Initialize blackboard tables if they don't exist
void initBlackboard(sqlite3* db) {
    const char* createCurrentData = R"(
        CREATE TABLE IF NOT EXISTS currentdata (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fuelMass INTEGER NOT NULL,
            height INTEGER NOT NULL,
            velocity INTEGER NOT NULL,
            thrustersActivated INTEGER NOT NULL DEFAULT 0
        );
    )";
    
    const char* createPreviousData = R"(
        CREATE TABLE IF NOT EXISTS previousdata (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fuelMass INTEGER NOT NULL,
            height INTEGER NOT NULL,
            velocity INTEGER NOT NULL,
            thrustersActivated INTEGER NOT NULL DEFAULT 0
        );
    )";
    
    // Initial state: 120kg fuel, 15000m altitude, 0 velocity
    const char* initCurrent = R"(
        INSERT OR IGNORE INTO currentdata (id, fuelMass, height, velocity, thrustersActivated)
        VALUES (1, 120, 15000, 0, 0);
    )";
    
    const char* initPrevious = R"(
        INSERT OR IGNORE INTO previousdata (id, fuelMass, height, velocity, thrustersActivated)
        VALUES (1, 120, 15000, 0, 0);
    )";
    
    execSQL(db, createCurrentData);
    execSQL(db, createPreviousData);
    execSQL(db, initCurrent);
    execSQL(db, initPrevious);
}

// KNOWLEDGE SOURCE 1: Sensor Module - Read state from blackboard
LanderData readDB(sqlite3* db, const char* table) {
    LanderData data = {0, 0, 0, false};
    
    std::string sql = "SELECT fuelMass, height, velocity, thrustersActivated FROM ";
    sql += table;
    sql += " WHERE id = 1;";
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "Failed to read from " << table << ": " << sqlite3_errmsg(db) << std::endl;
        return data;
    }
    
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        data.fuelMass = static_cast<unsigned long>(sqlite3_column_int(stmt, 0));
        data.height = static_cast<long>(sqlite3_column_int(stmt, 1));
        data.velocity = static_cast<long>(sqlite3_column_int(stmt, 2));
        data.thrustersActivated = sqlite3_column_int(stmt, 3) != 0;
    }
    
    sqlite3_finalize(stmt);
    return data;
}

// KNOWLEDGE SOURCE 2: Actuator Module - Write state to blackboard
void writeDB(sqlite3* db, const char* table, const LanderData& data) {
    std::string sql = "UPDATE ";
    sql += table;
    sql += " SET fuelMass = ?, height = ?, velocity = ?, thrustersActivated = ? WHERE id = 1;";
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "Failed to prepare write: " << sqlite3_errmsg(db) << std::endl;
        return;
    }
    
    sqlite3_bind_int(stmt, 1, static_cast<int>(data.fuelMass));
    sqlite3_bind_int(stmt, 2, static_cast<int>(data.height));
    sqlite3_bind_int(stmt, 3, static_cast<int>(data.velocity));
    sqlite3_bind_int(stmt, 4, data.thrustersActivated ? 1 : 0);
    
    rc = sqlite3_step(stmt);
    if (rc != SQLITE_DONE) {
        std::cerr << "Failed to write to " << table << ": " << sqlite3_errmsg(db) << std::endl;
    }
    
    sqlite3_finalize(stmt);
}

// KNOWLEDGE SOURCE 3: Physics Calculator - Compute next state
void updateLanderState(sqlite3* db, bool thrustersActivated) {
    // Initialize tables if first run
    initBlackboard(db);
    
    // READ from blackboard: get current state
    LanderData previous = readDB(db, "currentdata");
    
    // Save current to previous (for history)
    writeDB(db, "previousdata", previous);
    
    // Check if we can fire thrusters
    bool canFire = thrustersActivated && (previous.fuelMass >= BURN_RATE);
    
    // COMPUTE: Physics calculations (from equations.txt)
    // Sign convention: positive velocity = falling, positive acceleration = toward moon
    
    // Gravity varies with altitude: g = G * M / (R + h)^2
    double altitude = static_cast<double>(previous.height);
    double moonGravity = (G * MOON_MASS) / pow(MOON_RADIUS + altitude, 2);
    
    // Mass of lander (empty mass from DB is ~900kg)
    double emptyMass = 900.0;
    double totalMass = emptyMass + static_cast<double>(previous.fuelMass);
    
    // Thrust (upward = negative acceleration, counteracts gravity)
    double thrustAccel = canFire ? (THRUST_FORCE / totalMass) : 0.0;
    
    // Net acceleration: gravity pulls down (+), thrust pushes up (-)
    double acceleration = moonGravity - thrustAccel;
    
    // Update velocity: v = v0 + a*dt (positive = falling faster)
    double newVelocity = static_cast<double>(previous.velocity) + acceleration * DELTA_T;
    
    // Update altitude: h = h0 - v*dt (falling reduces height)
    double newHeight = altitude - newVelocity * DELTA_T;
    
    // Update fuel
    double newFuel = static_cast<double>(previous.fuelMass);
    if (canFire) {
        newFuel -= BURN_RATE * DELTA_T;
        if (newFuel < 0) newFuel = 0;
    }
    
    // WRITE to blackboard: store new state
    LanderData current;
    current.fuelMass = static_cast<unsigned long>(newFuel);
    current.height = static_cast<long>(newHeight);
    current.velocity = static_cast<long>(newVelocity);
    current.thrustersActivated = canFire;
    
    writeDB(db, "currentdata", current);
}

// KNOWLEDGE SOURCE 4: Display Module - Read and show telemetry
void printLanderTables(sqlite3* db) {
    // Initialize tables if they don't exist
    initBlackboard(db);
    
    LanderData current = readDB(db, "currentdata");
    LanderData previous = readDB(db, "previousdata");
    
    // Calculate gravity at current altitude
    double altitude = static_cast<double>(current.height);
    double moonGravity = (G * MOON_MASS) / pow(MOON_RADIUS + altitude, 2);
    
    std::cout << "\n========== LUNAR LANDER TELEMETRY ==========\n";
    std::cout << "  Altitude:    " << current.height << " m\n";
    std::cout << "  Velocity:    " << current.velocity << " m/s\n";
    std::cout << "  Fuel:        " << current.fuelMass << " kg\n";
    std::cout << "  Gravity:     " << moonGravity << " m/s^2\n";
    std::cout << "  Thrusters:   " << (current.thrustersActivated ? "FIRING" : "off") << "\n";
    std::cout << "=============================================\n";
    
    // Landing status
    if (current.height <= 0) {
        if (std::abs(current.velocity) <= 5) {
            std::cout << ">>> SUCCESSFUL LANDING! <<<\n";
        } else {
            std::cout << ">>> CRASH LANDING! Impact velocity: " << current.velocity << " m/s <<<\n";
        }
    } else if (current.fuelMass <= 0) {
        std::cout << "WARNING: OUT OF FUEL!\n";
    }
}
