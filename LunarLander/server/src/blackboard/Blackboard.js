/**
 * Blackboard Architecture for Lunar Lander Simulation
 * 
 * Central data store that all components read from and write to.
 * Based on the Mars Lander Blackboard Architecture pattern.
 * 
 * Components:
 * - Current Position: x, y, z coordinates and altitude
 * - Velocity: vx, vy, vz components
 * - Acceleration: ax, ay, az components
 * - Mission Parameters: 3D Path Plan, target landing site
 * - Ship Health: thermal state, structural integrity
 * - Environment: altitude, gravity, pressure (vacuum on moon)
 * - Inventory: fuel remaining
 * - Control: thruster state
 */

import { CONSTANTS, calculateGravity, calculateTimeToImpact } from '../physics/engine.js';

/**
 * Ship Health States
 */
export const HealthState = {
  GREEN: 'green',   // All systems nominal
  YELLOW: 'yellow', // Caution - approaching limits
  RED: 'red'        // Critical - damage occurring
};

/**
 * Mission Phases
 */
export const MissionPhase = {
  ORBIT: 'orbit',           // In lunar orbit
  DEORBIT: 'deorbit',       // Deorbit burn
  FREEFALL: 'freefall',     // Coasting toward surface
  BRAKING: 'braking',       // Main deceleration burn
  APPROACH: 'approach',     // Final approach
  TERMINAL: 'terminal',     // Last meters
  LANDED: 'landed',         // On surface
  CRASHED: 'crashed'        // Mission failure
};

/**
 * Blackboard class - Central state management
 */
export class Blackboard {
  constructor(config = {}) {
    // Initialize all blackboard components
    this.reset(config);
  }

  /**
   * Reset/Initialize the blackboard with starting configuration
   */
  reset(config = {}) {
    const {
      // Lander properties
      emptyMass = 2000,
      fuelCapacity = 5000,
      maxThrust = 35000,
      fuelConsumptionRate = 12,
      mode = 'manual',
      
      // Starting conditions
      startAltitude = 100000,  // 100 km
      startVelocity = 50,      // 50 m/s toward surface
      orbitalVelocity = 1680,  // ~1.68 km/s orbital velocity at 100km
      orbitalAngle = 0,        // Starting angle in orbit (radians)
      
      // Mission parameters
      landingTargetAngle = Math.PI / 4  // Target landing site (45 degrees)
    } = config;

    this.initialConfig = {
      emptyMass,
      fuelCapacity,
      maxThrust,
      fuelConsumptionRate,
      mode,
      startAltitude,
      startVelocity,
      orbitalVelocity,
      orbitalAngle,
      landingTargetAngle
    };

    // === CURRENT POSITION (3D) ===
    // Using spherical coordinates centered on Moon
    // r = distance from Moon center
    // theta = angle in orbital plane (longitude-like)
    // phi = angle from orbital plane (latitude-like, 0 for equatorial)
    const moonRadius = CONSTANTS.R_MOON;
    this.position = {
      r: moonRadius + startAltitude,      // Distance from Moon center
      theta: orbitalAngle,                 // Orbital angle (radians)
      phi: 0,                              // In orbital plane
      altitude: startAltitude,             // Height above surface (m)
      // Cartesian equivalents for rendering
      x: 0,
      y: 0,
      z: 0
    };
    this._updateCartesian();

    // === VELOCITY (3D) ===
    // Decomposed into radial (toward/away from surface) and tangential (orbital)
    this.velocity = {
      radial: startVelocity,       // Positive = toward surface (m/s)
      tangential: orbitalVelocity, // Orbital velocity (m/s)
      vertical: 0,                 // Out of orbital plane (m/s)
      // Magnitude
      magnitude: Math.sqrt(startVelocity ** 2 + orbitalVelocity ** 2)
    };

    // === ACCELERATION ===
    this.acceleration = {
      radial: 0,      // Net radial acceleration (m/s²)
      tangential: 0,  // Tangential acceleration (m/s²)
      gravity: calculateGravity(startAltitude),  // Local gravity (m/s²)
      thrust: 0,      // Thrust acceleration (m/s²)
      net: 0          // Net acceleration magnitude (m/s²)
    };

    // === MISSION PARAMETERS ===
    this.mission = {
      phase: MissionPhase.ORBIT,
      targetLandingAngle: landingTargetAngle,
      plannedPath: [],           // Array of waypoints
      actualPath: [],            // Recorded trajectory
      deorbitBurnAngle: 0,       // When to start deorbit
      optimalBrakingAltitude: 0, // Calculated optimal braking start
      missionTime: 0,            // Total mission time (s)
      phaseTime: 0               // Time in current phase (s)
    };

    // === SHIP HEALTH ===
    this.health = {
      state: HealthState.GREEN,
      thermalLoad: 0,           // Accumulated heat (0-100)
      thermalRate: 0,           // Current heating/cooling rate
      structuralIntegrity: 100, // Structural health (0-100)
      thrustDuration: 0,        // Continuous thrust time (s)
      maxContinuousThrust: 600,  // Max safe continuous thrust (s) - Apollo LM ~10 min descent
      coolingRate: 2,           // Thermal cooling per second (no thrust)
      heatingRate: 5,           // Thermal heating per second (full thrust)
      warnings: []              // Active warning messages
    };

    // === ENVIRONMENT ===
    this.environment = {
      altitude: startAltitude,
      gravity: calculateGravity(startAltitude),
      pressure: 0,  // Vacuum
      surfaceDistance: startAltitude,
      timeToImpact: 0,
      inShadow: false  // For thermal calculations
    };

    // === INVENTORY ===
    this.inventory = {
      fuel: fuelCapacity,
      fuelCapacity: fuelCapacity,
      fuelPercentage: 100,
      fuelBurnRate: 0  // Current burn rate (kg/s)
    };

    // === CONTROL ===
    this.control = {
      thrustPercent: 0,         // Commanded thrust (0-100)
      actualThrust: 0,          // Actual thrust force (N)
      maxThrust: maxThrust,
      mode,                     // 'manual' or 'auto'
      autopilotTarget: null,    // Current autopilot target
      thrusterHealth: 100       // Thruster condition (0-100)
    };

    // === LANDER SPECS ===
    this.lander = {
      emptyMass: emptyMass,
      totalMass: emptyMass + fuelCapacity,
      currentMass: emptyMass + fuelCapacity,
      fuelConsumptionRate: fuelConsumptionRate
    };

    // === LANDING RESULT ===
    this.landingResult = null;
    this.touchdownVelocity = null;

    // Calculate initial mission parameters
    this._calculateOptimalPath();
    this.recalculateDerivedState();
    this.recordPathPoint();
  }

  /**
   * Update Cartesian coordinates from spherical
   */
  _updateCartesian() {
    const { r, theta, phi } = this.position;
    this.position.x = r * Math.cos(phi) * Math.cos(theta);
    this.position.y = r * Math.cos(phi) * Math.sin(theta);
    this.position.z = r * Math.sin(phi);
  }

  /**
   * Calculate optimal landing path based on physics
   * Optimal strategy: freefall then constant thrust
   * Accounts for initial velocity: v² = v0² + 2*g*(H - h) during freefall
   * Braking altitude: d_c = (v0² + 2*g*H) / (2*A) — altitude at which to start braking
   */
  _calculateOptimalPath() {
    const g = calculateGravity(0);
    const mass = this.lander.currentMass;
    const A = this.control.maxThrust / mass;
    const H = this.position.altitude;
    const v0 = this.velocity.radial;  // Initial downward velocity

    // Optimal braking altitude from energy balance using the total available
    // upward thrust acceleration A, where braking distance solves:
    // v_touchdown² = v0² + 2g(H - d_c) - 2A·d_c = 0
    // d_c = (v0² + 2gH) / (2A)
    let d_c = (v0 * v0 + 2 * g * H) / (2 * A);
    if (d_c >= H) d_c = H;
    const d_f = Math.max(0, H - d_c);
    const v_max = Math.sqrt(v0 * v0 + 2 * g * d_f);

    this.mission.optimalBrakingAltitude = Math.max(0, Math.min(d_c, H));
    this.mission.optimalMaxVelocity = v_max;
    this.mission.optimalAlpha = (A - g) / g;

    this.mission.plannedPath = this._generatePlannedPath(H, d_f, d_c, v_max, A, g, v0);
  }

  /**
   * Generate waypoints for the planned descent path
   * Freefall: v² = v0² + 2*g*(H - alt). Braking: v² = 2*(A-g)*alt.
   */
  _generatePlannedPath(H, d_f, d_c, v_max, A, g, v0 = 0) {
    const waypoints = [];
    const numPoints = 50;

    // Phase 1: Freefall (altitude H to d_c)
    for (let i = 0; i <= numPoints / 2; i++) {
      const progress = i / (numPoints / 2);
      const alt = H - progress * d_f;
      const vel = Math.sqrt(v0 * v0 + 2 * g * (H - alt));
      waypoints.push({ altitude: alt, velocity: vel, phase: 'freefall', thrust: 0 });
    }

    // Phase 2: Braking (altitude d_c to 0)
    for (let i = 1; i <= numPoints / 2; i++) {
      const progress = i / (numPoints / 2);
      const alt = Math.max(0, d_c * (1 - progress));
      const vel = Math.sqrt(Math.max(0, 2 * (A - g) * alt));
      waypoints.push({ altitude: alt, velocity: vel, phase: 'braking', thrust: 100 });
    }

    return waypoints;
  }

  /**
   * Compute all derived state from the current blackboard fields.
   */
  recalculateDerivedState() {
    const altitude = this.position.altitude;
    const gravity = calculateGravity(altitude);

    this.position.r = CONSTANTS.R_MOON + altitude;
    this._updateCartesian();

    this.lander.totalMass = this.lander.emptyMass + this.inventory.fuelCapacity;
    this.lander.currentMass = this.lander.emptyMass + this.inventory.fuel;

    this.velocity.magnitude = Math.sqrt(
      this.velocity.radial ** 2 + this.velocity.tangential ** 2 + this.velocity.vertical ** 2
    );

    this.acceleration.gravity = gravity;

    this.environment.altitude = altitude;
    this.environment.gravity = gravity;
    this.environment.surfaceDistance = altitude;
    this.environment.timeToImpact = altitude <= 0
      ? 0
      : calculateTimeToImpact(altitude, this.velocity.radial, gravity);

    this.inventory.fuelPercentage = this.inventory.fuelCapacity > 0
      ? (this.inventory.fuel / this.inventory.fuelCapacity) * 100
      : 0;

    this.updatePhase();
  }

  /**
   * Record current position to actual path
   */
  recordPathPoint() {
    this.mission.actualPath.push({
      time: this.mission.missionTime,
      altitude: this.position.altitude,
      velocity: this.velocity.radial,
      theta: this.position.theta,
      thrust: this.control.thrustPercent,
      phase: this.mission.phase,
      health: this.health.state
    });

    // Keep path size manageable
    if (this.mission.actualPath.length > 1000) {
      this.mission.actualPath = this.mission.actualPath.filter((_, i) => i % 2 === 0);
    }
  }

  /**
   * Update ship health based on current conditions
   */
  updateHealth(dt) {
    const { thrustPercent } = this.control;
    const warnings = [];

    // Thermal management
    if (thrustPercent > 0) {
      // Heating proportional to thrust
      const heatingFactor = (thrustPercent / 100) * this.health.heatingRate;
      this.health.thermalLoad += heatingFactor * dt;
      this.health.thrustDuration += dt;
      this.health.thermalRate = heatingFactor;
    } else {
      // Cooling when not thrusting
      this.health.thermalLoad = Math.max(0, this.health.thermalLoad - this.health.coolingRate * dt);
      this.health.thrustDuration = Math.max(0, this.health.thrustDuration - dt * 2);
      this.health.thermalRate = -this.health.coolingRate;
    }

    // Clamp thermal load
    this.health.thermalLoad = Math.min(100, this.health.thermalLoad);

    // Check continuous thrust limits
    if (this.health.thrustDuration > this.health.maxContinuousThrust * 0.8) {
      warnings.push('THRUSTER OVERHEAT WARNING');
    }
    if (this.health.thrustDuration > this.health.maxContinuousThrust) {
      // Thruster degradation
      this.health.structuralIntegrity -= dt * 0.5;
      this.control.thrusterHealth -= dt * 0.2;
      warnings.push('THRUSTER DAMAGE - REDUCE THRUST');
    }

    // Determine health state
    if (this.health.thermalLoad > 80 || this.health.structuralIntegrity < 50) {
      this.health.state = HealthState.RED;
    } else if (this.health.thermalLoad > 50 || this.health.structuralIntegrity < 75) {
      this.health.state = HealthState.YELLOW;
    } else {
      this.health.state = HealthState.GREEN;
    }

    // High G-force check
    const gForce = Math.abs(this.acceleration.net) / 9.81;  // In Earth g's
    if (gForce > 8) {
      warnings.push(`HIGH G-FORCE: ${gForce.toFixed(1)}g`);
      if (gForce > 12) {
        this.health.structuralIntegrity -= dt * 0.1;
      }
    }

    this.health.warnings = warnings;
  }

  /**
   * Update mission phase based on current state
   */
  updatePhase() {
    const { altitude } = this.position;
    const { radial: velocity } = this.velocity;
    const { thrustPercent } = this.control;

    // Already landed or crashed
    if (this.mission.phase === MissionPhase.LANDED || 
        this.mission.phase === MissionPhase.CRASHED) {
      return;
    }

    // Check for landing
    if (altitude <= 0) {
      if (Math.abs(velocity) <= 5) {
        this.mission.phase = MissionPhase.LANDED;
      } else {
        this.mission.phase = MissionPhase.CRASHED;
      }
      return;
    }

    // Determine phase based on altitude and actions
    if (altitude > 50000 && thrustPercent < 10 && this.velocity.tangential > 1000) {
      this.mission.phase = MissionPhase.ORBIT;
    } else if (altitude > 50000 && thrustPercent > 0) {
      this.mission.phase = MissionPhase.DEORBIT;
    } else if (altitude > this.mission.optimalBrakingAltitude && thrustPercent < 10) {
      this.mission.phase = MissionPhase.FREEFALL;
    } else if (altitude > 100 && thrustPercent > 10) {
      this.mission.phase = MissionPhase.BRAKING;
    } else if (altitude > 20) {
      this.mission.phase = MissionPhase.APPROACH;
    } else {
      this.mission.phase = MissionPhase.TERMINAL;
    }
  }

  /**
   * Get a snapshot of the blackboard for the Pilot View (frontend)
   */
  getSnapshot() {
    return {
      // Position
      position: { ...this.position },
      altitude: this.position.altitude,
      
      // Velocity
      velocity: this.velocity.radial,
      velocityVector: { ...this.velocity },
      
      // Acceleration
      acceleration: this.acceleration.radial,
      accelerationMagnitude: this.acceleration.net,
      gravity: this.acceleration.gravity,
      
      // Mission
      phase: this.mission.phase,
      missionTime: this.mission.missionTime,
      plannedPath: this.mission.plannedPath,
      actualPath: this.mission.actualPath,
      optimalBrakingAltitude: this.mission.optimalBrakingAltitude,
      
      // Health
      health: this.health.state,
      thermalLoad: this.health.thermalLoad,
      structuralIntegrity: this.health.structuralIntegrity,
      warnings: this.health.warnings,
      
      // Environment
      environment: { ...this.environment },
      timeToImpact: this.environment.timeToImpact,
      
      // Inventory
      fuel: this.inventory.fuel,
      fuelCapacity: this.inventory.fuelCapacity,
      fuelPercentage: this.inventory.fuelPercentage,
      
      // Control
      thrust: this.control.actualThrust,
      thrustPercent: this.control.thrustPercent,
      maxThrust: this.control.maxThrust,
      mode: this.control.mode,
      
      // Lander
      mass: this.lander.currentMass,
      emptyMass: this.lander.emptyMass,
      
      // Status
      hasLanded: this.mission.phase === MissionPhase.LANDED || 
                 this.mission.phase === MissionPhase.CRASHED,
      landingResult: this.landingResult,
      touchdownVelocity: this.touchdownVelocity
    };
  }
}

export default Blackboard;
