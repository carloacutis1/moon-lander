#include <iostream>
#include "sqlite3.h"

int main() {
    sqlite3 *db;
    int rc = sqlite3_open("../moon_lander.db", &db);
    if (rc) {
        std::cerr << "Can't open database: " << sqlite3_errmsg(db) << std::endl;
        return 1;
    } else {
        std::cout << "Opened database successfully!" << std::endl;
    }

    // Example: Query landers
    const char *sql = "SELECT name, empty_mass_kg, fuel_capacity_kg FROM landers;";
    sqlite3_stmt *stmt;
    rc = sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "Failed to prepare statement: " << sqlite3_errmsg(db) << std::endl;
        sqlite3_close(db);
        return 1;
    }

    std::cout << "Landers:\n";
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        std::cout << "Name: " << sqlite3_column_text(stmt, 0)
                  << ", Empty Mass: " << sqlite3_column_double(stmt, 1)
                  << ", Fuel Capacity: " << sqlite3_column_double(stmt, 2) << std::endl;
    }

    sqlite3_finalize(stmt);
    sqlite3_close(db);
    return 0;
}
