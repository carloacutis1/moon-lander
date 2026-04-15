/**
 * Advanced Physics Engine for Lunar Lander
 * 
 * Implements the Galilean equations of motion (G1, G2, G3):
 * G1: v = v₀ + a × Δt
 * G2: h = h₀ + v₀ × Δt + a × (Δt)² / 2
 * G3: Δv² = 2 × a × Δd
 * 
 * Includes:
 * - 3D orbital mechanics
 * - Optimal landing strategy (freefall + braking)
 * - Variable gravity with altitude
 * - Fuel consumption
 * - Thermal/health effects
 */

// Physical Constants
export const CONSTANTS = {
  G: 6.67430e-11,           // Gravitational constant (N⋅m²/kg²)
  M_MOON: 7.34767309e22,    // Moon mass (kg)
  R_MOON: 1740000,          // Moon radius (m) - 1740 km
  G_SURFACE: 1.6197838058061498, // Surface gravity from G*M/R^2 (m/s²)
  ORBITAL_VELOCITY_100KM: 1680,  // Orbital velocity at 100km altitude (m/s)
  SAFE_VELOCITY_MIN: 0,     // Minimum safe landing velocity (m/s)
  SAFE_VELOCITY_MAX: 5,     // Maximum safe landing velocity (m/s)
  THRUST_EFFICIENCY: 3000,  // Fallback thrust per kg of fuel (N per kg/s)
};

const EPSILON = 1e-9;

/**
 * Calculate gravitational acceleration at a given altitude
 * g = G × M_moon / (R_moon + h)²
 */
export function calculateGravity(altitude) {
  const r = CONSTANTS.R_MOON + Math.max(0, altitude);
  return (CONSTANTS.G * CONSTANTS.M_MOON) / (r * r);
}

/**
 * Calculate orbital velocity at a given altitude
 * v_orbital = √(G × M / r)
 */
export function calculateOrbitalVelocity(altitude) {
  const r = CONSTANTS.R_MOON + altitude;
  return Math.sqrt(CONSTANTS.G * CONSTANTS.M_MOON / r);
}

/**
 * Calculate time to impact in freefall
 * Using quadratic formula: h = v×t + 0.5×g×t²
 */
export function calculateTimeToImpact(altitude, velocity, gravity) {
  if (altitude <= 0) return 0;
  if (velocity <= 0 && gravity <= 0) return Infinity;
  
  // Quadratic: 0.5*g*t² + v*t - h = 0
  // t = (-v + √(v² + 2gh)) / g
  const discriminant = velocity * velocity + 2 * gravity * altitude;
  if (discriminant < 0) return Infinity;
  
  return (-velocity + Math.sqrt(discriminant)) / gravity;
}

/**
 * Solve for the impact time within the current step assuming constant
 * acceleration and the positive-downward velocity convention:
 * h(t) = h0 - v0*t + 0.5*a*t^2
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

function resolvePropulsion(thrustPercent, maxThrust, maxFuelBurnRate, fuel, dt) {
  const clampedThrustPercent = Math.max(0, Math.min(100, thrustPercent));
  const requestedThrust = (clampedThrustPercent / 100) * maxThrust;
  const fallbackFuelBurnRate = maxThrust / CONSTANTS.THRUST_EFFICIENCY;
  const commandedFuelBurnRate = (clampedThrustPercent / 100) * (
    maxFuelBurnRate > 0 ? maxFuelBurnRate : fallbackFuelBurnRate
  );
  const availableFuelBurnRate = dt > 0 ? fuel / dt : 0;
  const actualFuelBurnRate = Math.min(commandedFuelBurnRate, availableFuelBurnRate);
  const actualThrust = commandedFuelBurnRate > 0
    ? (actualFuelBurnRate / commandedFuelBurnRate) * requestedThrust
    : 0;

  return {
    clampedThrustPercent,
    actualFuelBurnRate,
    actualThrust
  };
}

/**
 * Evaluate landing quality
 * Velocity is primary; structural damage from descent overheating reduces rating.
 */
export function evaluateLanding(velocity, health = { structuralIntegrity: 100 }) {
  const speed = Math.abs(velocity);
  const healthPenalty = health.structuralIntegrity < 50;

  if (speed <= CONSTANTS.SAFE_VELOCITY_MAX) {
    // Safe touchdown velocity - success (descent damage may downgrade rating)
    if (speed <= 2 && !healthPenalty) {
      return { success: true, rating: 'perfect', message: 'Perfect landing! The Eagle has landed.' };
    } else if (speed <= 4) {
      return {
        success: true,
        rating: healthPenalty ? 'hard' : 'good',
        message: healthPenalty ? 'Good velocity but descent damage. Minor repairs needed.' : 'Good landing. Crew safe.'
      };
    } else {
      return {
        success: true,
        rating: healthPenalty ? 'hard' : 'hard',
        message: 'Hard landing but within limits. Minor damage possible.'
      };
    }
  } else if (speed <= 10) {
    return { success: false, rating: 'crash-survivable', message: 'Crash landing! Significant damage but survivable.' };
  } else {
    return { success: false, rating: 'crash-fatal', message: 'Mission failed. Lander destroyed on impact.' };
  }
}

/**
 * Optimal Autopilot - smooth descent with reliable landing
 *
 * Strategy (see docs/PHYSICS_PLAN.md):
 * 1. COAST: Zero thrust above optimal braking altitude
 * 2. BRAKE: Follow velocity profile v_target = sqrt(2*(a_net)*h)*0.85 + 1.5
 * 3. TERMINAL: Last 15m - gentle hover for soft touchdown
 *
 * Uses proportional control for smooth throttle (not discrete levels).
 */
export function optimalAutopilotThrust(blackboard, dt = 1) {
  const { position, velocity, mission, inventory, lander, control } = blackboard;
  const altitude = position.altitude;
  const v = velocity.radial;  // Positive = toward surface (falling)
  const fuel = inventory.fuel;
  const mass = lander.currentMass;
  const maxThrust = control.maxThrust;
  const maxFuelBurnRate = lander.fuelConsumptionRate > 0
    ? lander.fuelConsumptionRate
    : maxThrust / CONSTANTS.THRUST_EFFICIENCY;
  const gainScale = 1 / Math.max(dt, 0.01);

  if (fuel <= 0 || altitude <= 0) return 0;

  const g = calculateGravity(altitude);
  const maxAccel = maxThrust / mass;
  const netDecel = maxAccel - g;  // Net deceleration at full thrust

  if (netDecel <= 0) return 100;  // Can't overcome gravity

  // Optimal braking altitude from Blackboard (or conservative default)
  const optBrakeAlt = mission.optimalBrakingAltitude || altitude * 0.4;
  const brakeThreshold = optBrakeAlt * 1.3;  // Start braking 30% above optimal

  // Hover thrust % - thrust needed to counteract gravity
  const hoverPct = (mass * g / maxThrust) * 100;

  // --- FUEL EFFICIENCY CHECK ---
  // Estimate fuel needed for safe landing from current state
  const estimatedBrakingTime = (v / netDecel) * 1.5; // 1.5x safety margin
  const fuelNeeded = estimatedBrakingTime * maxFuelBurnRate;
  if (fuel < fuelNeeded && altitude > 50) {
    // Not enough fuel for safe landing - start emergency braking now
    return 100;
  }

  // --- TERMINAL PHASE (last 150m): Smooth approach to 2 m/s touchdown ---
  if (altitude < 150) {
    // Target: ramp 8 m/s at 150m -> 2 m/s at 0m (smoother, less aggressive)
    const targetV = 2 + (altitude / 150) * 6;
    const maxAllowedV = Math.sqrt(2 * netDecel * altitude * 0.8);

    if (v > maxAllowedV) return 100;  // Emergency - can't stop in time
    if (v > targetV) {
      const error = v - targetV;
      const Kp = 15 * gainScale;  // Aggressive for last 150m
      return Math.min(100, Math.max(hoverPct, hoverPct + error * Kp));
    }
    // On target - gentle hover with slight descent (98% gives ~0.03 m/s descent rate)
    return Math.max(0, hoverPct * 0.98);
  }

  // --- BRAKING ZONE (below brake threshold) ---
  if (altitude <= brakeThreshold) {
    // Target: v² = 2 * netDecel * h * 0.65 (65% - conservative for dt=1s lag)
    const targetV = Math.sqrt(2 * netDecel * altitude * 0.65) + 1.5;

    if (v > targetV + 15) return 100;  // Way too fast - full brake
    if (v > targetV) {
      const error = v - targetV;
      const Kp = 12 * gainScale;  // Aggressive - must not overshoot target profile
      return Math.min(100, Math.max(hoverPct, hoverPct + error * Kp));
    }
    // Slightly higher hover (90% vs 88%) for smoother descent
    return Math.max(0, hoverPct * 0.90);
  }

  // --- PRE-BRAKE: Approaching braking zone - limit velocity buildup ---
  const maxSafeV = Math.sqrt(2 * netDecel * altitude * 0.7);
  if (v > maxSafeV * 0.95) {
    const targetV = maxSafeV * 0.9;
    const error = v - targetV;
    return Math.min(100, Math.max(0, hoverPct + error * (8 * gainScale)));
  }

  // --- COAST ZONE ---
  return 0;
}

/**
 * Simple autopilot for legacy state format (backwards compatibility)
 */
export function simpleAutopilotThrust(state) {
  const { altitude, velocity, fuel, emptyMass, maxThrust } = state;
  
  if (fuel <= 0 || altitude <= 0) return 0;
  
  const mass = emptyMass + fuel;
  const g = calculateGravity(altitude);
  const netDecel = (maxThrust / mass) - g;
  
  if (netDecel <= 0) return 100;
  
  const stoppingDistance = (velocity * velocity) / (2 * netDecel);
  const safetyFactor = 2.0;
  
  // Simple decision: if altitude < 2x stopping distance, brake
  if (altitude <= stoppingDistance * safetyFactor) {
    const urgency = stoppingDistance / altitude;
    if (urgency > 0.8) return 100;
    if (urgency > 0.5) return 85;
    if (urgency > 0.3) return 70;
    
    const targetV = Math.sqrt(2 * netDecel * altitude / safetyFactor) * 0.7 + 2;
    if (velocity > targetV) {
      const hoverThrust = (mass * g / maxThrust) * 100;
      return Math.min(100, hoverThrust + (velocity - targetV) * 5);
    }
    return (mass * g / maxThrust) * 100 * 0.85;
  }
  
  // Coasting - check velocity limit
  const maxSafeV = Math.sqrt(2 * netDecel * altitude / safetyFactor);
  if (velocity > maxSafeV * 0.9) {
    return velocity > maxSafeV ? 80 : 30;
  }
  
  return 0;
}

/**
 * Perform one simulation step using the Blackboard
 * 
 * @param {Blackboard} blackboard - The simulation blackboard
 * @param {number} thrustPercent - Commanded thrust (0-100)
 * @param {number} dt - Time step in seconds
 * @returns {Blackboard} Updated blackboard
 */
export function simulationStep(blackboard, thrustPercent, dt = 1) {
  // Clamp dt for numerical stability (prevent extreme timesteps)
  dt = Math.max(0.01, Math.min(2.0, dt));

  // Get current state from blackboard
  const altitude = blackboard.position.altitude;
  const velocity = blackboard.velocity.radial;
  const fuel = blackboard.inventory.fuel;
  const mass = blackboard.lander.currentMass;
  const maxThrust = blackboard.control.maxThrust;
  const maxFuelBurnRate = blackboard.lander.fuelConsumptionRate > 0
    ? blackboard.lander.fuelConsumptionRate
    : maxThrust / CONSTANTS.THRUST_EFFICIENCY;
  const emptyMass = blackboard.lander.emptyMass;
  
  // Calculate gravity at current altitude
  const gravity = calculateGravity(altitude);
  
  // Calculate actual thrust (limited by fuel)
  const {
    clampedThrustPercent,
    actualFuelBurnRate,
    actualThrust
  } = resolvePropulsion(thrustPercent, maxThrust, maxFuelBurnRate, fuel, dt);
  
  // === EQUATIONS OF MOTION (G1, G2 from slides) ===
  
  // Net acceleration: a = (Thrust - Weight) / mass
  // Positive thrust decelerates the fall
  const thrustAccel = actualThrust / mass;  // Upward (positive)
  const netAccel = thrustAccel - gravity;    // Net (negative = falling faster)

  // Predict touchdown within the current step so that mission time, fuel use,
  // and impact velocity reflect the precise surface contact event.
  const predictedAltitude = altitude - velocity * dt + 0.5 * netAccel * dt * dt;
  const hasTouchdownThisStep = altitude > 0 && predictedAltitude <= 0;
  const elapsedTime = hasTouchdownThisStep
    ? (calculateTouchdownTime(altitude, velocity, netAccel, dt) ?? dt)
    : dt;

  const physicalVelocity = velocity - netAccel * elapsedTime;
  const physicalAltitude = altitude - velocity * elapsedTime + 0.5 * netAccel * elapsedTime * elapsedTime;
  const newAltitude = hasTouchdownThisStep ? 0 : Math.max(0, physicalAltitude);

  // Update fuel using the actual time elapsed in this step.
  const actualFuelUsed = Math.min(fuel, actualFuelBurnRate * elapsedTime);
  const newFuel = Math.max(0, fuel - actualFuelUsed);
  const newMass = emptyMass + newFuel;
  
  // === UPDATE BLACKBOARD ===
  
  // Position
  blackboard.position.altitude = newAltitude;
  blackboard.position.r = CONSTANTS.R_MOON + newAltitude;
  
  // Update orbital position (simplified - just rotate for visualization)
  if (blackboard.velocity.tangential > 0) {
    const angularVelocity = blackboard.velocity.tangential / blackboard.position.r;
    blackboard.position.theta += angularVelocity * dt;
  }
  blackboard._updateCartesian();
  
  // Velocity
  blackboard.velocity.radial = physicalVelocity;
  blackboard.velocity.magnitude = Math.sqrt(
    physicalVelocity ** 2 + blackboard.velocity.tangential ** 2
  );
  
  // Reduce tangential velocity as we descend (simplified orbital decay)
  if (newAltitude < 50000) {
    blackboard.velocity.tangential *= 0.9999;
  }
  
  // Acceleration
  blackboard.acceleration.gravity = gravity;
  blackboard.acceleration.thrust = thrustAccel;
  blackboard.acceleration.radial = netAccel;
  blackboard.acceleration.net = Math.abs(netAccel);
  
  // Control
  blackboard.control.thrustPercent = clampedThrustPercent;
  blackboard.control.actualThrust = actualThrust;
  
  // Inventory
  blackboard.inventory.fuel = newFuel;
  blackboard.inventory.fuelPercentage = (newFuel / blackboard.inventory.fuelCapacity) * 100;
  blackboard.inventory.fuelBurnRate = elapsedTime > 0 ? actualFuelUsed / elapsedTime : 0;
  
  // Lander
  blackboard.lander.currentMass = newMass;
  
  // Environment
  blackboard.environment.altitude = newAltitude;
  blackboard.environment.gravity = gravity;
  blackboard.environment.surfaceDistance = newAltitude;
  blackboard.environment.timeToImpact = hasTouchdownThisStep
    ? 0
    : calculateTimeToImpact(newAltitude, physicalVelocity, gravity);
  
  // Mission time
  blackboard.mission.missionTime += elapsedTime;
  blackboard.mission.phaseTime += elapsedTime;
  
  // Update health
  blackboard.updateHealth(elapsedTime);

  if (hasTouchdownThisStep) {
    blackboard.touchdownVelocity = Math.abs(physicalVelocity);
  }
  
  // Update mission phase
  blackboard.updatePhase();
  
  // Record path point (every 5 seconds or at low altitude)
  if (Math.floor(blackboard.mission.missionTime) % 5 === 0 || newAltitude < 1000 || hasTouchdownThisStep) {
    blackboard.recordPathPoint();
  }
  
  // Check for landing - use the touchdown velocity before settling to zero.
  if (hasTouchdownThisStep) {
    blackboard.landingResult = evaluateLanding(blackboard.touchdownVelocity, blackboard.health);
    blackboard.environment.timeToImpact = 0;
    // Stop all motion once the touchdown event has been recorded.
    blackboard.velocity.radial = 0;
    blackboard.velocity.tangential = 0;
    blackboard.velocity.vertical = 0;
    blackboard.velocity.magnitude = 0;
  }
  
  return blackboard;
}

/**
 * Legacy simulation step function for backwards compatibility
 */
export function legacySimulationStep(state, thrustPercent, dt = 1) {
  const {
    altitude,
    velocity,
    fuel,
    emptyMass,
    maxThrust,
    time
  } = state;

  const mass = emptyMass + fuel;
  const gravity = calculateGravity(altitude);
  const maxFuelBurnRate = state.fuelConsumptionRate > 0
    ? state.fuelConsumptionRate
    : maxThrust / CONSTANTS.THRUST_EFFICIENCY;
  
  const {
    clampedThrustPercent,
    actualFuelBurnRate,
    actualThrust
  } = resolvePropulsion(thrustPercent, maxThrust, maxFuelBurnRate, fuel, dt);
  
  const thrustAccel = actualThrust / mass;
  const netAccel = thrustAccel - gravity;

  const predictedAltitude = altitude - velocity * dt + 0.5 * netAccel * dt * dt;
  const hasTouchdownThisStep = altitude > 0 && predictedAltitude <= 0;
  const elapsedTime = hasTouchdownThisStep
    ? (calculateTouchdownTime(altitude, velocity, netAccel, dt) ?? dt)
    : dt;
  const physicalVelocity = velocity - netAccel * elapsedTime;
  const newAltitude = hasTouchdownThisStep
    ? 0
    : Math.max(0, altitude - velocity * elapsedTime + 0.5 * netAccel * elapsedTime * elapsedTime);
  const actualFuelUsed = Math.min(fuel, actualFuelBurnRate * elapsedTime);
  const newFuel = Math.max(0, fuel - actualFuelUsed);
  const newMass = emptyMass + newFuel;
  const newTime = time + elapsedTime;
  
  const hasLanded = hasTouchdownThisStep;
  const touchdownVelocity = hasTouchdownThisStep ? Math.abs(physicalVelocity) : null;
  const landingResult = hasLanded
    ? evaluateLanding(touchdownVelocity, { structuralIntegrity: 100 })
    : null;
  const timeToImpact = hasLanded ? 0 : calculateTimeToImpact(newAltitude, physicalVelocity, gravity);
  
  return {
    ...state,
    altitude: newAltitude,
    velocity: hasLanded ? 0 : physicalVelocity,
    fuel: newFuel,
    mass: newMass,
    time: newTime,
    gravity,
    acceleration: netAccel,
    thrust: actualThrust,
    thrustPercent: clampedThrustPercent,
    fuelUsed: actualFuelUsed,
    timeToImpact,
    hasLanded,
    landingResult,
    touchdownVelocity
  };
}

export default {
  CONSTANTS,
  calculateGravity,
  calculateOrbitalVelocity,
  calculateTimeToImpact,
  evaluateLanding,
  optimalAutopilotThrust,
  simulationStep,
  legacySimulationStep
};
