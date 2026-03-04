#include <cmath>
#include <iostream>

constexpr double G{6.67430E-11};
constexpr double MOON_RADIUS{1738.1};
constexpr long EMPTY_LANDER_MASS{450000};
constexpr unsigned STARTING_FUEL_MASS{2000};
constexpr unsigned STARTING_HEIGHT{200000};
constexpr unsigned long THRUST_REQUIRED_FUEL_MASS{10};
constexpr unsigned long THRUST_NEWTONS{300000000};
constexpr double MOON_MASS{10.346E22};
constexpr unsigned DELTA_T{1};

struct LanderData {
  unsigned long fuelMass;
  long height;
  long velocity;
  bool thrustersActivated;
} sqlDatabase{STARTING_FUEL_MASS, STARTING_HEIGHT, 0, false};

// print varibles to stdout
void printDebugInfo(const LanderData &data) {
  const unsigned long totalMass{data.fuelMass + EMPTY_LANDER_MASS};
  const long startingMass{EMPTY_LANDER_MASS + STARTING_FUEL_MASS};
  std::cout << "Mass : " << totalMass << " / " << startingMass << '\n';

  const unsigned long fuelPercentage{100 * data.fuelMass / STARTING_FUEL_MASS};
  std::cout << "Fuel : " << fuelPercentage << "%\n";

  std::cout << "Height : " << data.height << '\n';

  std::cout << "Velocity : " << data.velocity << '\n';

  std::cout << "Thrusters Activated? : " << data.thrustersActivated;

  std::cout << '\n';
}

// simulate reading the SQL database
LanderData readDB() {
  LanderData ret{sqlDatabase};
  std::string rawInput;

  // simulate user input (assuming input is written to DB)
  std::getline(std::cin, rawInput);
  ret.thrustersActivated =
      rawInput == "f" && ret.fuelMass >= THRUST_REQUIRED_FUEL_MASS;

  return ret;
}

void writeDB(const LanderData &data) { sqlDatabase = data; }

int main() {
  // print true and false rather than 1 and 0
  std::cout << std::boolalpha;

  while (true) {
    printDebugInfo(sqlDatabase);

    const LanderData previousData{readDB()};
    LanderData currentData{previousData};

    currentData.fuelMass = previousData.fuelMass - previousData.thrustersActivated * THRUST_REQUIRED_FUEL_MASS;

    const unsigned long previousLanderMass{previousData.fuelMass + EMPTY_LANDER_MASS};
    const double moonGravity{G * MOON_MASS / pow(MOON_RADIUS + previousData.height, 2)};
    const double netForce{moonGravity * previousLanderMass - previousData.thrustersActivated * THRUST_NEWTONS};

    double acceleration{ netForce / (previousLanderMass - previousData.thrustersActivated *
                                             THRUST_REQUIRED_FUEL_MASS * 0.5)};

    currentData.height = previousData.height - previousData.velocity * DELTA_T - acceleration * 0.5 * pow(DELTA_T, 2);

    currentData.velocity = previousData.velocity + acceleration * DELTA_T;

    if (previousData.thrustersActivated) {
      currentData.fuelMass -= THRUST_REQUIRED_FUEL_MASS;
    }

    writeDB(currentData);

    if (currentData.height <= 0) {
        std::cout << "Crash : " << (currentData.velocity > 5);
        break;
    }
  }
}
