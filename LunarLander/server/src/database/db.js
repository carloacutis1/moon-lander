/**
 * Lunar Lander Database Module
 * 
 * Uses in-memory storage with JSON persistence.
 * Implements the same data patterns as SQL would for equations, constants, and configs.
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CONSTANTS } from '../physics/advancedEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Data storage paths
const dataDir = process.env.LUNAR_LANDER_DATA_DIR || join(__dirname, '../../data');
const dbFile = process.env.LUNAR_LANDER_DB_FILE || join(dataDir, 'lunar_lander.json');

// In-memory database
let database = {
  physical_constants: [],
  equations: [],
  lander_configs: [],
  simulation_sessions: [],
  telemetry_log: []
};

// Auto-increment counters
let counters = {
  physical_constants: 0,
  equations: 0,
  lander_configs: 0,
  telemetry_log: 0
};

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load existing data if available
function loadDatabase() {
  try {
    if (fs.existsSync(dbFile)) {
      const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      database = data.database || database;
      counters = data.counters || counters;
      console.log('Database loaded from disk');
    }
  } catch (error) {
    console.log('Starting with fresh database');
  }
}

// Save database to disk
function saveDatabase() {
  try {
    fs.writeFileSync(dbFile, JSON.stringify({ database, counters }, null, 2));
  } catch (error) {
    console.error('Failed to save database:', error);
  }
}

function getReferenceData() {
  const now = new Date().toISOString();

  return {
    physical_constants: [
      { id: 1, name: 'Gravitational Constant', symbol: 'G', value: CONSTANTS.G, unit: 'N⋅m²/kg²', description: 'Universal gravitational constant', created_at: now },
      { id: 2, name: 'Moon Mass', symbol: 'M_moon', value: CONSTANTS.M_MOON, unit: 'kg', description: 'Mass of the Moon', created_at: now },
      { id: 3, name: 'Moon Radius', symbol: 'R_moon', value: CONSTANTS.R_MOON, unit: 'm', description: 'Mean radius of the Moon', created_at: now },
      { id: 4, name: 'Moon Surface Gravity', symbol: 'g_surface', value: CONSTANTS.G_SURFACE, unit: 'm/s²', description: 'Surface gravity derived from G×M/R²', created_at: now },
      { id: 5, name: 'Safe Landing Velocity Min', symbol: 'v_safe_min', value: CONSTANTS.SAFE_VELOCITY_MIN, unit: 'm/s', description: 'Minimum safe landing velocity', created_at: now },
      { id: 6, name: 'Safe Landing Velocity Max', symbol: 'v_safe_max', value: CONSTANTS.SAFE_VELOCITY_MAX, unit: 'm/s', description: 'Maximum safe landing velocity', created_at: now }
    ],
    equations: [
      {
        id: 1,
        name: 'Gravitational Acceleration at Altitude',
        formula: 'g(h) = G × M_moon / (R_moon + h)²',
        description: 'Local lunar gravity. With the current constants: g(20 km) ≈ 1.583180 m/s² and g(100 km) ≈ 1.448505 m/s².',
        variables: JSON.stringify(['G', 'M_moon', 'R_moon', 'h']),
        category: 'gravity',
        created_at: now
      },
      {
        id: 2,
        name: 'Net Radial Acceleration',
        formula: 'a_net = F_thrust / m - g(h)',
        description: 'Signed radial acceleration. Positive values decelerate descent; negative values accelerate the fall.',
        variables: JSON.stringify(['F_thrust', 'm', 'g']),
        category: 'motion',
        created_at: now
      },
      {
        id: 3,
        name: 'Velocity Update',
        formula: 'v_new = v_old - a_net × Δt',
        description: 'Positive velocity is defined as motion toward the lunar surface.',
        variables: JSON.stringify(['v_old', 'a_net', 'dt']),
        category: 'motion',
        created_at: now
      },
      {
        id: 4,
        name: 'Altitude Update',
        formula: 'h_new = h_old - v_old × Δt + 0.5 × a_net × (Δt)²',
        description: 'Constant-acceleration altitude update using the same positive-downward velocity convention.',
        variables: JSON.stringify(['h_old', 'v_old', 'a_net', 'dt']),
        category: 'motion',
        created_at: now
      },
      {
        id: 5,
        name: 'Fuel Burn Rate',
        formula: 'm_fuel = ṁ_max × throttle × Δt',
        description: 'Per-lander maximum fuel burn rate scaled by throttle. Actual thrust is reduced proportionally if fuel is insufficient for the timestep.',
        variables: JSON.stringify(['mdot_max', 'throttle', 'dt']),
        category: 'propulsion',
        created_at: now
      },
      {
        id: 6,
        name: 'Touchdown Velocity',
        formula: 'v_touchdown = |v(t_impact)| at h = 0',
        description: 'Landing quality is evaluated using the exact touchdown speed at the surface contact time inside the current timestep.',
        variables: JSON.stringify(['v_impact']),
        category: 'safety',
        created_at: now
      }
    ],
    lander_configs: [
      { id: 1, name: 'Apollo LM Descent Stage', empty_mass: 2150, fuel_capacity: 8200, max_thrust: 45000, fuel_consumption_rate: 15, description: 'Apollo-inspired crewed descent stage configuration for vertical lunar landing training', created_at: now },
      { id: 2, name: 'Light Lander', empty_mass: 1000, fuel_capacity: 2500, max_thrust: 20000, fuel_consumption_rate: 7, description: 'Lightweight unmanned lander for cargo delivery', created_at: now },
      { id: 3, name: 'Heavy Lander', empty_mass: 5000, fuel_capacity: 12000, max_thrust: 80000, fuel_consumption_rate: 27, description: 'Heavy lander for crew and equipment', created_at: now },
      { id: 4, name: 'Training Lander', empty_mass: 2000, fuel_capacity: 5000, max_thrust: 35000, fuel_consumption_rate: 12, description: 'Standard training configuration', created_at: now }
    ]
  };
}

function syncReferenceData() {
  const referenceData = getReferenceData();

  database.physical_constants = referenceData.physical_constants;
  database.equations = referenceData.equations;
  database.lander_configs = referenceData.lander_configs;

  counters.physical_constants = database.physical_constants.length;
  counters.equations = database.equations.length;
  counters.lander_configs = database.lander_configs.length;

  saveDatabase();
}

// Initialize database
export function initializeDatabase() {
  loadDatabase();
  syncReferenceData();
  console.log('Database initialized');
}

// Seed initial data
export function seedDatabase() {
  syncReferenceData();
  console.log('Reference data synchronized');
}

// Query methods
export const queries = {
  // Physical constants
  getAllConstants: () => database.physical_constants,
  getConstantById: (id) => database.physical_constants.find(c => c.id === id),
  
  // Equations
  getAllEquations: () => database.equations.map(eq => ({
    ...eq,
    variables: JSON.parse(eq.variables)
  })),
  getEquationsByCategory: (category) => database.equations
    .filter(eq => eq.category === category)
    .map(eq => ({ ...eq, variables: JSON.parse(eq.variables) })),
  
  // Lander configs
  getAllLanders: () => database.lander_configs,
  getLanderById: (id) => database.lander_configs.find(l => l.id === id),
  
  // Simulation sessions
  createSession: (session) => {
    database.simulation_sessions.push(session);
    saveDatabase();
    return session;
  },
  getSession: (id) => database.simulation_sessions.find(s => s.id === id),
  updateSession: (id, updates) => {
    const index = database.simulation_sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      database.simulation_sessions[index] = { ...database.simulation_sessions[index], ...updates };
      saveDatabase();
      return database.simulation_sessions[index];
    }
    return null;
  },
  getAllSessions: () => database.simulation_sessions.slice(-50).reverse(),
  
  // Telemetry
  logTelemetry: (entry) => {
    counters.telemetry_log++;
    entry.id = counters.telemetry_log;
    entry.created_at = new Date().toISOString();
    database.telemetry_log.push(entry);
    // Keep only last 10000 entries
    if (database.telemetry_log.length > 10000) {
      database.telemetry_log = database.telemetry_log.slice(-10000);
    }
  },
  getTelemetry: (sessionId) => database.telemetry_log
    .filter(t => t.session_id === sessionId)
    .sort((a, b) => a.timestamp - b.timestamp)
};

export default { queries, initializeDatabase, seedDatabase };
