/**
 * Lunar Lander Physics Engine
 * 
 * Implements the physics equations for lunar landing simulation based on:
 * - Gravitational acceleration at altitude: g(h) = G * M_moon / (R_moon + h)²
 * - Net radial acceleration: a_net = F_thrust / m - g(h)
 * - Velocity update: v_new = v_old - a_net * Δt
 * - Altitude update: h_new = h_old - v_old * Δt + 0.5 * a_net * Δt²
 * 
 * Convention: Positive velocity = moving toward moon (falling)
 *             Negative velocity = moving away from moon (ascending)
 */

// Physical Constants
export const CONSTANTS = {
  G: 6.67430e-11,           // Gravitational constant (N⋅m²/kg²)
  M_MOON: 7.34767309e22,    // Moon mass (kg)
  R_MOON: 1740000,          // Moon radius (m)
  G_SURFACE: 1.6197838058061498, // Surface gravity from G*M/R^2 (m/s²)
  SAFE_VELOCITY_MIN: 0,     // Minimum safe landing velocity (m/s)
  SAFE_VELOCITY_MAX: 5,     // Maximum safe landing velocity (m/s)
  THRUST_EFFICIENCY: 3000,  // Fallback thrust per kg of fuel (N per kg/s)
};

const EPSILON = 1e-9;

/**
 * Calculate gravitational acceleration at a given altitude
 * g = G * M_moon / (R_moon + h)²
 * 
 * @param {number} altitude - Height above moon surface in meters
 * @returns {number} Gravitational acceleration in m/s²
 */
export function calculateGravity(altitude) {
  const r = CONSTANTS.R_MOON + Math.max(0, altitude);
  return (CONSTANTS.G * CONSTANTS.M_MOON) / (r * r);
}

/**
 * Calculate net acceleration during thrust
 * a = (F - g * m_lander) / (m_lander - 0.5 * m_fuel_used)
 * 
 * Uses average mass during burn for more accurate calculation
 * 
 * @param {number} thrust - Thrust force in Newtons
 * @param {number} gravity - Local gravitational acceleration in m/s²
 * @param {number} mass - Current lander mass in kg
 * @param {number} fuelUsed - Fuel consumed during this timestep in kg
 * @returns {number} Net acceleration in m/s² (negative = upward/decelerating fall)
 */
export function calculateAcceleration(thrust, gravity, mass, fuelUsed = 0) {
  // Average mass during burn
  const avgMass = mass - (0.5 * fuelUsed);
  
  // Net force: thrust (up) - gravity force (down)
  // Positive acceleration = slowing down the fall (thrust winning)
  // We use convention where positive velocity = falling
  // So positive acceleration from thrust means deceleration of fall
  const netAcceleration = (thrust - gravity * avgMass) / avgMass;
  
  return netAcceleration;
}

/**
 * Update velocity based on acceleration
 * v_t = v_{t-1} + a * Δt
 * 
 * Note: In our convention, positive velocity = falling toward moon
 *       Positive acceleration from thrust = decelerating the fall
 *       So we subtract the thrust acceleration from velocity
 * 
 * @param {number} velocity - Current velocity in m/s (positive = falling)
 * @param {number} acceleration - Net acceleration in m/s²
 * @param {number} dt - Time step in seconds
 * @returns {number} New velocity in m/s
 */
export function updateVelocity(velocity, acceleration, dt) {
  // During freefall: acceleration is negative (gravity pulls down, increases fall speed)
  // During thrust: acceleration can be positive (thrust slows fall) or still negative
  return velocity - acceleration * dt;
}

/**
 * Update altitude based on velocity and acceleration
 * h_t = h_{t-1} - v_{t-1} * Δt - 0.5 * a * Δt²
 * 
 * @param {number} altitude - Current altitude in meters
 * @param {number} velocity - Current velocity in m/s (positive = falling)
 * @param {number} acceleration - Net acceleration in m/s²
 * @param {number} dt - Time step in seconds
 * @returns {number} New altitude in meters
 */
export function updateAltitude(altitude, velocity, acceleration, dt) {
  // h decreases when falling (positive velocity)
  // h increases when thrust overcomes gravity
  const newAltitude = altitude - velocity * dt + 0.5 * acceleration * dt * dt;
  return Math.max(0, newAltitude);
}

/**
 * Calculate fuel consumed for a given thrust over a time period
 * 
 * @param {number} thrust - Thrust force in Newtons
 * @param {number} efficiency - Thrust per kg of fuel (N per kg/s)
 * @param {number} dt - Time step in seconds
 * @returns {number} Fuel consumed in kg
 */
export function calculateFuelConsumption(thrust, efficiency, dt) {
  if (thrust <= 0) return 0;
  return (thrust / efficiency) * dt;
}

/**
 * Solve for the exact touchdown time inside a single constant-acceleration step.
 */
export function calculateTouchdownTime(altitude, velocity, acceleration, maxDt) {
  if (altitude <= 0 || maxDt <= 0) return 0;

  if (Math.abs(acceleration) < EPSILON) {
    if (velocity <= 0) return null;
    const time = altitude / velocity;
    return time >= 0 && time <= maxDt ? time : null;
  }

  const discriminant = (velocity * velocity) - (2 * acceleration * altitude);
  if (discriminant < 0) return null;

  const sqrtDiscriminant = Math.sqrt(discriminant);
  const candidateTimes = [
    (velocity - sqrtDiscriminant) / acceleration,
    (velocity + sqrtDiscriminant) / acceleration
  ]
    .filter((time) => Number.isFinite(time) && time >= 0 && time <= maxDt)
    .sort((left, right) => left - right);

  return candidateTimes.length > 0 ? candidateTimes[0] : null;
}

/**
 * Calculate time to impact in freefall (no thrust)
 * Using quadratic formula: h = v*t + 0.5*g*t²
 * t = (-v + sqrt(v² + 2*g*h)) / g
 * 
 * @param {number} altitude - Current altitude in meters
 * @param {number} velocity - Current velocity in m/s
 * @param {number} gravity - Gravitational acceleration in m/s²
 * @returns {number} Estimated time to impact in seconds
 */
export function calculateTimeToImpact(altitude, velocity, gravity) {
  if (altitude <= 0) return 0;
  
  // Quadratic formula for time
  const discriminant = velocity * velocity + 2 * gravity * altitude;
  if (discriminant < 0) return Infinity;
  
  // t = (-v + √(v² + 2gh)) / g for impact when v is positive (falling)
  return (-velocity + Math.sqrt(discriminant)) / gravity;
}

/**
 * Calculate required thrust to achieve desired deceleration
 * F = m * (g + a_desired)
 * 
 * @param {number} mass - Current mass in kg
 * @param {number} gravity - Local gravity in m/s²
 * @param {number} desiredDeceleration - Desired deceleration in m/s²
 * @returns {number} Required thrust in Newtons
 */
export function calculateRequiredThrust(mass, gravity, desiredDeceleration) {
  return mass * (gravity + desiredDeceleration);
}

/**
 * Determine if landing velocity is safe
 * Safe landing: 0 ≤ v ≤ 5 m/s
 * 
 * @param {number} velocity - Landing velocity in m/s
 * @returns {object} Landing result with status and description
 */
export function evaluateLanding(velocity) {
  const speed = Math.abs(velocity);
  
  if (speed <= CONSTANTS.SAFE_VELOCITY_MAX) {
    if (speed <= 2) {
      return { 
        success: true, 
        rating: 'perfect',
        message: 'Perfect landing! The Eagle has landed.' 
      };
    } else if (speed <= 4) {
      return { 
        success: true, 
        rating: 'good',
        message: 'Good landing. Crew safe.' 
      };
    } else {
      return { 
        success: true, 
        rating: 'hard',
        message: 'Hard landing but within limits. Minor damage possible.' 
      };
    }
  } else if (speed <= 10) {
    return { 
      success: false, 
      rating: 'crash-survivable',
      message: 'Crash landing! Significant damage but survivable.' 
    };
  } else {
    return { 
      success: false, 
      rating: 'crash-fatal',
      message: 'Mission failed. Lander destroyed on impact.' 
    };
  }
}

/**
 * Perform one simulation step
 * 
 * @param {object} state - Current simulation state
 * @param {number} thrustPercent - Thrust percentage (0-100)
 * @param {number} dt - Time step in seconds
 * @returns {object} New simulation state
 */
export function simulationStep(state, thrustPercent, dt = 1) {
  const {
    altitude,
    velocity,
    fuel,
    emptyMass,
    maxThrust,
    fuelConsumptionRate,
    time
  } = state;

  // Current total mass
  const mass = emptyMass + fuel;
  
  // Calculate gravity at current altitude
  const gravity = calculateGravity(altitude);
  
  // Calculate actual thrust (limited by fuel and percentage)
  const clampedThrustPercent = Math.max(0, Math.min(100, thrustPercent));
  const requestedThrust = (clampedThrustPercent / 100) * maxThrust;
  const maxFuelBurnRate = fuelConsumptionRate > 0
    ? fuelConsumptionRate
    : maxThrust / CONSTANTS.THRUST_EFFICIENCY;
  const commandedFuelBurnRate = (clampedThrustPercent / 100) * maxFuelBurnRate;
  const availableFuelBurnRate = dt > 0 ? fuel / dt : 0;
  const actualFuelBurnRate = Math.min(commandedFuelBurnRate, availableFuelBurnRate);
  const actualThrust = commandedFuelBurnRate > 0
    ? (actualFuelBurnRate / commandedFuelBurnRate) * requestedThrust
    : 0;
  
  // Calculate acceleration
  const acceleration = calculateAcceleration(actualThrust, gravity, mass, 0);
  
  // Update state using the exact touchdown time if we cross the surface inside
  // the current timestep.
  const predictedAltitude = updateAltitude(altitude, velocity, acceleration, dt);
  const hasTouchdownThisStep = altitude > 0 && predictedAltitude <= 0;
  const elapsedTime = hasTouchdownThisStep
    ? (calculateTouchdownTime(altitude, velocity, acceleration, dt) ?? dt)
    : dt;
  const physicalVelocity = updateVelocity(velocity, acceleration, elapsedTime);
  const newAltitude = hasTouchdownThisStep
    ? 0
    : updateAltitude(altitude, velocity, acceleration, elapsedTime);
  const actualFuelUsed = Math.min(fuel, actualFuelBurnRate * elapsedTime);
  const newFuel = Math.max(0, fuel - actualFuelUsed);
  const newMass = emptyMass + newFuel;
  const newTime = time + elapsedTime;
  
  // Check for landing
  const hasLanded = hasTouchdownThisStep;
  const touchdownVelocity = hasLanded ? Math.abs(physicalVelocity) : null;
  const landingResult = hasLanded ? evaluateLanding(touchdownVelocity) : null;
  
  // Calculate time to impact
  const timeToImpact = hasLanded ? 0 : calculateTimeToImpact(newAltitude, physicalVelocity, gravity);
  
  return {
    ...state,
    altitude: newAltitude,
    velocity: hasLanded ? 0 : physicalVelocity,
    fuel: newFuel,
    mass: newMass,
    time: newTime,
    gravity,
    acceleration,
    thrust: actualThrust,
    thrustPercent: clampedThrustPercent,
    fuelUsed: actualFuelUsed,
    timeToImpact,
    hasLanded,
    landingResult,
    touchdownVelocity
  };
}

/**
 * Calculate the maximum safe velocity at a given altitude
 * Based on: to stop from velocity v over distance h with deceleration a:
 * v² = 2 * a * h  =>  v = sqrt(2 * a * h)
 * 
 * @param {number} altitude - Current altitude in meters
 * @param {number} maxDecel - Maximum deceleration available in m/s²
 * @returns {number} Maximum safe velocity at this altitude
 */
function calculateSafeVelocity(altitude, maxDecel) {
  // Target landing velocity
  const targetLandingVelocity = 2.0; // m/s
  
  // Use only 50% of max decel for large safety margin
  const safeDecel = maxDecel * 0.5;
  
  // v² = v_final² + 2*a*h
  // v = sqrt(v_final² + 2*a*h)
  const safeV = Math.sqrt(targetLandingVelocity * targetLandingVelocity + 2 * safeDecel * altitude);
  
  return safeV;
}

/**
 * Auto-pilot algorithm for landing
 * 
 * Uses a conservative continuous braking approach:
 * 1. Always track a safe velocity profile based on altitude
 * 2. If exceeding safe velocity, brake aggressively
 * 3. At low altitude, prioritize safety over fuel efficiency
 * 
 * @param {object} state - Current simulation state
 * @returns {number} Recommended thrust percentage (0-100)
 */
export function autopilotThrust(state) {
  const { altitude, velocity, fuel, emptyMass, maxThrust } = state;
  
  // No fuel, no thrust
  if (fuel <= 0) return 0;
  
  // Already landed
  if (altitude <= 0) return 0;
  
  const mass = emptyMass + fuel;
  const gravity = calculateGravity(altitude);
  const weight = mass * gravity;
  
  // Calculate thrust needed just to hover (counteract gravity)
  const hoverThrust = weight;
  const hoverThrustPercent = (hoverThrust / maxThrust) * 100;
  
  // Calculate maximum available deceleration at full thrust
  // a_max = (F_max - weight) / mass = (F_max / mass) - g
  const maxDecel = (maxThrust / mass) - gravity;
  
  if (maxDecel <= 0) {
    // Can't overcome gravity - use maximum thrust
    return 100;
  }
  
  // Calculate the stopping distance needed at current velocity
  // Using 50% of max decel for safety margin
  const safeDecel = maxDecel * 0.5;
  const stoppingDistance = (velocity * velocity) / (2 * safeDecel);
  
  // Calculate maximum safe velocity at current altitude
  const safeVelocity = calculateSafeVelocity(altitude, maxDecel);
  
  // How much buffer do we have? (negative = danger!)
  const altitudeBuffer = altitude - stoppingDistance;
  
  let thrustPercent = 0;
  
  // === AGGRESSIVE SAFETY-FIRST CONTROL ===
  
  // CRITICAL: If stopping distance exceeds altitude, FULL BRAKE NOW
  if (stoppingDistance > altitude * 0.8) {
    return 100; // Emergency full thrust
  }
  
  // If velocity exceeds safe velocity, brake proportionally
  if (velocity > safeVelocity) {
    const velocityRatio = velocity / safeVelocity;
    if (velocityRatio > 1.5) {
      // Way too fast - full thrust
      thrustPercent = 100;
    } else if (velocityRatio > 1.2) {
      // Too fast - strong braking (90-100%)
      thrustPercent = 90 + (velocityRatio - 1.2) * 33;
    } else {
      // Slightly too fast - moderate braking
      const requiredDecel = (velocity - safeVelocity) * 2.0; // Aggressive gain
      const requiredThrust = mass * (gravity + requiredDecel);
      thrustPercent = (requiredThrust / maxThrust) * 100;
    }
  }
  
  // ALTITUDE-BASED VELOCITY LIMITS (hard limits)
  let maxAllowedVelocity;
  if (altitude > 1000) {
    maxAllowedVelocity = 50;
  } else if (altitude > 500) {
    maxAllowedVelocity = 30;
  } else if (altitude > 200) {
    maxAllowedVelocity = 20;
  } else if (altitude > 100) {
    maxAllowedVelocity = 12;
  } else if (altitude > 50) {
    maxAllowedVelocity = 8;
  } else if (altitude > 20) {
    maxAllowedVelocity = 5;
  } else if (altitude > 10) {
    maxAllowedVelocity = 4;
  } else {
    maxAllowedVelocity = 3;
  }
  
  // If exceeding altitude-based limit, override with braking
  if (velocity > maxAllowedVelocity) {
    const excess = velocity - maxAllowedVelocity;
    const requiredDecel = excess * 1.5 + gravity; // Strong braking + counteract gravity
    const requiredThrust = mass * requiredDecel;
    const overrideThrust = (requiredThrust / maxThrust) * 100;
    thrustPercent = Math.max(thrustPercent, overrideThrust);
  }
  
  // LOW ALTITUDE FINAL APPROACH (below 50m)
  if (altitude < 50) {
    const targetV = 2.0 + (altitude / 50) * 3; // 2 m/s at ground, 5 m/s at 50m
    
    if (velocity > targetV + 2) {
      // Too fast - strong braking
      thrustPercent = Math.max(thrustPercent, 95);
    } else if (velocity > targetV) {
      // Slightly too fast
      const requiredDecel = (velocity - targetV) * 2.0;
      const requiredThrust = mass * (gravity + requiredDecel);
      const finalThrust = (requiredThrust / maxThrust) * 100;
      thrustPercent = Math.max(thrustPercent, finalThrust);
    } else if (velocity < targetV - 1) {
      // Too slow - let it fall a bit
      thrustPercent = hoverThrustPercent * 0.7;
    } else {
      // Good - gentle descent
      thrustPercent = Math.max(thrustPercent, hoverThrustPercent * 0.85);
    }
  }
  
  // FINAL METERS - ultra precise control
  if (altitude < 15) {
    if (velocity > 4) {
      thrustPercent = 100;
    } else if (velocity > 3) {
      thrustPercent = Math.max(thrustPercent, 90);
    } else if (velocity > 2.5) {
      const fine = (velocity - 2.5) * 4; // 0 to 2 m/s² decel
      const requiredThrust = mass * (gravity + fine);
      thrustPercent = Math.max(thrustPercent, (requiredThrust / maxThrust) * 100);
    } else if (velocity < 1.5) {
      // Too slow
      thrustPercent = hoverThrustPercent * 0.6;
    } else {
      // Perfect approach
      thrustPercent = hoverThrustPercent * 0.9;
    }
  }
  
  // LAST 5 METERS - emergency override
  if (altitude < 5 && velocity > 3) {
    thrustPercent = 100;
  }
  
  // Clamp to valid range
  return Math.max(0, Math.min(100, thrustPercent));
}

export default {
  CONSTANTS,
  calculateGravity,
  calculateAcceleration,
  updateVelocity,
  updateAltitude,
  calculateFuelConsumption,
  calculateTimeToImpact,
  calculateRequiredThrust,
  evaluateLanding,
  simulationStep,
  autopilotThrust
};
