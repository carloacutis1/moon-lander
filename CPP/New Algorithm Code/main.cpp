#include "Lander.h"
#include <array>
#include <iomanip>
#include <iostream>
#include <ostream>
#include <sstream>

static constexpr unsigned STARTING_HEIGHT { 100'000 };
static constexpr unsigned STARTING_FUEL_MASS_KG { 10'920 };
static constexpr unsigned DEBUG_DISPLAY_WIDTH { 80 };

const std::array<std::string, 5> BORED_MESSAGE {
    "######  ##  ###    ###     #######  ######  ######   #####  ####     ##         ",
    "  ##    ##  ####  ####     ##   ##  ##  ##  ##   ##  ##     ##  ##   ##         ",
    "  ##        ##  ##  ##     #####    ##  ##  ######   #####  ##  ##   ##         ",
    "  ##        ##  ##  ##     ##   ##  ##  ##  ##  ##   ##     ##  ##              ",
    "######      ##  ##  ##     #######  ######  ##   ##  #####  ####     ##         "
};

Lander sqlDatabase { STARTING_FUEL_MASS_KG, STARTING_HEIGHT, 0 };

// print varibles to stdout
void printDebugInfo(const Lander& lander)
{
    static std::size_t scrollOffset {};
    constexpr const char* ANSI_CLEAR { "\033[2J" };
    constexpr const char* ANSI_HOME { "\033[H" };

    std::cout << ANSI_HOME << ANSI_CLEAR;
    for (std::size_t i {}; i < DEBUG_DISPLAY_WIDTH; ++i) {
        std::cout << "-";
    }
    std::cout << '\n';

    if (lander.getBoredom() >= 100) {
        for (auto& line : BORED_MESSAGE) {
            std::size_t leftoverSpace { line.length() - scrollOffset };
            std::cout << line.substr(scrollOffset, DEBUG_DISPLAY_WIDTH);
            std::cout << line.substr(0, DEBUG_DISPLAY_WIDTH - leftoverSpace) << '\n';
        }
        scrollOffset = (scrollOffset + 1) % BORED_MESSAGE[0].size();
    } else {
        const auto currentMass { lander.getFuelMass() + EMPTY_LANDER_MASS_KG };
        const auto startingMass { lander.getFuelMass() + EMPTY_LANDER_MASS_KG };
        std::cout << std::setw(DEBUG_DISPLAY_WIDTH / 2)
                  << (std::ostringstream {} << "Mass : " << currentMass << " / " << startingMass).str()
                  << "Boredom : " << lander.getBoredom() << '\n';

        std::cout << std::setw(DEBUG_DISPLAY_WIDTH / 2)
                  << (std::ostringstream {} << "Fuel : " << 100 * lander.getFuelMass() / STARTING_FUEL_MASS_KG << "%").str()
                  << "Temperature : " << lander.getTemperature() << '\n';

        std::cout << std::setw(DEBUG_DISPLAY_WIDTH / 2)
                  << (std::ostringstream {} << "Height : " << lander.getHeight()).str()
                  << lander.getThrustTicks() << '\n';

        std::cout << "Velocity : " << lander.getVelocity() << '\n';

        if (lander.getTicksTilLanding().has_value()) {
            std::cout << "Ticks until landing : " << *lander.getTicksTilLanding() << '\n';
        } else {
            std::cout << "Ticks until landing : " << "INF" << '\n';
        }

        std::cout << "Thrusters Activated? : " << lander.getPreviousThrusterState() << '\n';
    }

    for (std::size_t i {}; i < DEBUG_DISPLAY_WIDTH; ++i) {
        std::cout << "-";
    }
    std::cout << '\n';
}

// simulate reading the SQL database
Lander readDB()
{
    return sqlDatabase;
}

void writeDB(const Lander& lander)
{
    sqlDatabase = lander;
}

int main()
{
    // print true and false rather than 1 and 0, and left align fields
    std::cout << std::boolalpha << std::left;

    while (true) {
        Lander lander { readDB() };
        std::string rawInput;

        if (lander.getIsOverheated()) {
            std::cout << "OVERHEATED THRUSTERS DISABLED";
        }
        std::getline(std::cin, rawInput);

        lander.tick(
            rawInput == "f"
            && lander.getFuelMass() >= THRUST_REQUIRED_FUEL_MASS
            && !lander.getIsOverheated());

        printDebugInfo(lander);
        writeDB(lander);

        if (lander.getHeight() <= 0) {
            std::cout << "Crash : " << (lander.getVelocity() > 5);
            break;
        }
    }
}
