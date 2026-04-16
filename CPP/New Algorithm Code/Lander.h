#pragma once
#include <algorithm>
#include <cmath>
#include <optional>

constexpr double MOON_RADIUS { 1738.1 };
constexpr long EMPTY_LANDER_MASS_KG { 4280 };
constexpr double DELTA_T { 0.1 };
constexpr long THRUST_REQUIRED_FUEL_MASS { 10 };

class Lander {
public:
    Lander(long newFuelMass, double newHeight, double newVelocity)
        : fuelMass { newFuelMass }
        , height { newHeight }
        , velocity { newVelocity }
        , boredom {}
        , previousThrusterState {}
        , thrustScore {}
        , thrustForce{30'000'000}
    {
        setTemperature(temperature);
    }

    void tick(bool thrusterState)
    {
        constexpr double MOON_MASS { 10.346E22 };
        constexpr double G { 6.67430E-11 };
        constexpr long HEATUP_TICKS { 5 };
        constexpr long COOLDOWN_TICKS { 10 };
        const auto landerMass { fuelMass + EMPTY_LANDER_MASS_KG };

        if (getIsOverheated() && thrusterState) {
            thrusterState = false;
        }

        if (thrusterState) {
            if ((thrustScore += 2) > HEATUP_TICKS) {
                setTemperature(temperature + 1);
                thrustScore = 0;
            }
            thrustScore = std::clamp(thrustScore, 0L, HEATUP_TICKS);
        } else {
            if (--thrustScore < -COOLDOWN_TICKS) {
                setTemperature(temperature - 1);
                thrustScore = 0;
            }
            thrustScore = std::clamp(thrustScore, -COOLDOWN_TICKS, 0L);
        }

        auto newFuelMass { fuelMass };
        if (thrusterState) {
            newFuelMass -= THRUST_REQUIRED_FUEL_MASS;
        }

        auto netForce { G * MOON_MASS * landerMass / pow(MOON_RADIUS + height, 2) };
        if (thrusterState) {
            netForce -= thrustForce;
        }

        auto acceleration { netForce / landerMass };
        if (thrusterState) {
            acceleration -= THRUST_REQUIRED_FUEL_MASS * 0.5;
        }

        auto newVelocity { velocity + acceleration * DELTA_T };

        auto newHeight { height - velocity * DELTA_T - acceleration * 0.5 * pow(DELTA_T, 2) };

        auto newBoredom { boredom + (velocity < 1'000) };
        if (velocity > 0 && velocity < 2'000) {
            newBoredom = boredom + 1;
        } else if (velocity > 0) {
            newBoredom = boredom - 1;
        }
        newBoredom = std::clamp(newBoredom, 0L, 100L);

        previousThrusterState = thrusterState;
        fuelMass = newFuelMass;
        height = newHeight;
        velocity = newVelocity;
        boredom = newBoredom;

        ticksTilLanding.reset();
    };

    long getFuelMass() const { return fuelMass; };

    double getHeight() const { return height; };

    double getVelocity() const { return velocity; };

    long getBoredom() const { return boredom; }

    bool getPreviousThrusterState() const { return previousThrusterState; }

    long getThrustTicks() const { return thrustScore; }

    long getTemperature() const { return temperature; }
    void setTemperature(long newTemperature)
    {
        temperature = std::clamp(newTemperature, 0L, 100L);
        if (temperature >= 5) {
            isOverheated = true;
        }
        if (temperature <= 0) {
            isOverheated = false;
        }
    }

    long getThrustForce() const { return thrustForce; }
    void setThrustForce(long newThrustForce) {
        thrustForce = newThrustForce;
    }

    // optional is empty if lander thinks it will never land
    std::optional<long long> getTicksTilLanding() const
    {
        if (ticksTilLanding) {
            return ticksTilLanding;
        }

        Lander copy { *this };
        ticksTilLanding = 0;

        while (copy.height > 0) {
            const auto previousVelocity { copy.velocity };

            copy.tick(false);
            ticksTilLanding = ++(*ticksTilLanding);

            if (copy.velocity < previousVelocity || copy.velocity < 0 && copy.velocity == previousVelocity) {
                ticksTilLanding.reset();
                break;
            }
        }
        return ticksTilLanding;
    }

    bool getIsOverheated()
    {
        return isOverheated;
    }

private:
    long fuelMass;
    double height;
    double velocity;
    long boredom;
    bool previousThrusterState;
    mutable std::optional<long long> ticksTilLanding;
    long temperature;
    long thrustScore;
    long isOverheated;
    long thrustForce;
};
