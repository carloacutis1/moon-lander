// Cross-platform Moon Lander - Blackboard Architecture
#include <iostream>
#include <string>
#include "sqlite3.h"
#include "demo.h"

// Relative path works on both Windows and macOS
// Assumes executable runs from CPP folder, DB is in parent directory
#ifdef _WIN32
    #define DB_PATH "..\\moon_lander.db"
#else
    #define DB_PATH "../moon_lander.db"
#endif

int main() {
    sqlite3* db;
    int rc = sqlite3_open(DB_PATH, &db);
    if (rc) {
        std::cerr << "Can't open database: " << sqlite3_errmsg(db) << std::endl;
        std::cerr << "Make sure moon_lander.db exists in the parent directory." << std::endl;
        return 1;
    }
    else {
        std::cout << "Opened database successfully!" << std::endl;
    }

    // Reset tables to default values at program start
    resetLanderTables(db);

    std::cout << std::boolalpha;
    while (true) {
        printLanderTables(db);
        std::cout << "Activate thrusters? (f for fire, enter for no): ";
        std::string input;
        std::getline(std::cin, input);
        bool thrusters = (input == "f");
        updateLanderState(db, thrusters);
        LanderData current = readDB(db, "currentdata");
        if (current.height <= 0) {
            std::cout << "Crash : " << (current.velocity > 5) << std::endl;
            break;
        }
    }
    sqlite3_close(db);
    return 0;
}

