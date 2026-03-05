// ...existing includes...
#include <iostream>
#include <string>
#include "sqlite3.h"
#include "demo.h"

int main() {
    sqlite3* db;
    int rc = sqlite3_open("C:/Users/gusjo_lw96ve5/OneDrive/Desktop/moon-lander/moon_lander.db", &db);
    if (rc) {
        std::cerr << "Can't open database: " << sqlite3_errmsg(db) << std::endl;
        return 1;
    }
    else {
        std::cout << "Opened database successfully!" << std::endl;
    }

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

