import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { initializeDatabase, seedDatabase, queries } from './database/db.js';
import { Blackboard } from './blackboard/Blackboard.js';
import { 
  simulationStep, 
  optimalAutopilotThrust, 
  simpleAutopilotThrust,
  legacySimulationStep,
  CONSTANTS,
  calculateGravity,
  calculateTimeToImpact
} from './physics/advancedEngine.js';

// Re-export for physics API routes
const physics = { calculateGravity, calculateTimeToImpact };

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database on startup
initializeDatabase();
seedDatabase();

// Store active simulations in memory
const activeSimulations = new Map();
const MAX_PHYSICS_SUBSTEP = 1;
const apiDirectory = [
  { method: 'GET', path: '/api/health', description: 'Health check', browserFriendly: true },
  { method: 'GET', path: '/api/constants', description: 'Physical constants', browserFriendly: true },
  { method: 'GET', path: '/api/equations', description: 'All physics equations', browserFriendly: true },
  { method: 'GET', path: '/api/equations/:category', description: 'Equations filtered by category', browserFriendly: false },
  { method: 'GET', path: '/api/landers', description: 'Available lander configurations', browserFriendly: true },
  { method: 'GET', path: '/api/landers/:id', description: 'Single lander configuration', browserFriendly: false },
  { method: 'POST', path: '/api/simulation/start', description: 'Start a new simulation session', browserFriendly: false },
  { method: 'POST', path: '/api/simulation/:sessionId/step', description: 'Advance a session by one or more timesteps', browserFriendly: false },
  { method: 'GET', path: '/api/simulation/:sessionId', description: 'Get current simulation state', browserFriendly: false },
  { method: 'GET', path: '/api/simulation/:sessionId/telemetry', description: 'Get telemetry history for a session', browserFriendly: false },
  { method: 'POST', path: '/api/simulation/:sessionId/mode', description: 'Switch between manual and auto mode', browserFriendly: false },
  { method: 'POST', path: '/api/simulation/:sessionId/reset', description: 'Reset a simulation session', browserFriendly: false },
  { method: 'POST', path: '/api/physics/gravity', description: 'Calculate gravity at a requested altitude', browserFriendly: false },
  { method: 'POST', path: '/api/physics/time-to-impact', description: 'Calculate time to impact from a requested state', browserFriendly: false },
  { method: 'GET', path: '/api/sessions', description: 'Recent simulation sessions', browserFriendly: true }
];

function renderApiHome() {
  const routeList = apiDirectory.map((route) => {
    const routePath = route.browserFriendly ? route.path : null;
    const routeLabel = routePath
      ? `<a href="${routePath}">${route.path}</a>`
      : route.path;

    return `
      <li>
        <span class="method method-${route.method.toLowerCase()}">${route.method}</span>
        <span class="path">${routeLabel}</span>
        <span class="description">${route.description}</span>
      </li>
    `;
  }).join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Lunar Lander API</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #081120;
        --panel: rgba(17, 24, 39, 0.92);
        --border: rgba(148, 163, 184, 0.2);
        --text: #e5eefc;
        --muted: #9fb0c9;
        --blue: #4ea8ff;
        --green: #42d392;
        --amber: #f6c453;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        font-family: "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        background:
          radial-gradient(circle at top, rgba(78, 168, 255, 0.18), transparent 35%),
          linear-gradient(180deg, #050b16, var(--bg));
        color: var(--text);
      }

      main {
        max-width: 960px;
        margin: 0 auto;
        padding: 48px 20px 64px;
      }

      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 24px;
        backdrop-filter: blur(8px);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
      }

      h1 {
        margin: 0 0 8px;
        font-size: clamp(2rem, 5vw, 3rem);
      }

      p {
        margin: 0 0 16px;
        color: var(--muted);
        line-height: 1.5;
      }

      .links {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin: 24px 0;
      }

      .link {
        display: inline-block;
        padding: 10px 14px;
        border-radius: 999px;
        border: 1px solid var(--border);
        color: var(--text);
        text-decoration: none;
        background: rgba(78, 168, 255, 0.12);
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 24px 0 0;
      }

      li {
        display: grid;
        grid-template-columns: 84px minmax(0, 1.3fr) minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        padding: 14px 0;
        border-top: 1px solid var(--border);
      }

      .method {
        display: inline-flex;
        justify-content: center;
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
      }

      .method-get {
        background: rgba(66, 211, 146, 0.16);
        color: var(--green);
      }

      .method-post {
        background: rgba(246, 196, 83, 0.16);
        color: var(--amber);
      }

      .path, .path a {
        color: var(--blue);
        text-decoration: none;
        word-break: break-word;
      }

      .description {
        color: var(--muted);
      }

      @media (max-width: 720px) {
        li {
          grid-template-columns: 1fr;
          gap: 8px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="panel">
        <h1>Lunar Lander API</h1>
        <p>The backend is running. Browser-friendly <code>GET</code> endpoints are linked below, while <code>POST</code> endpoints should be called from the frontend, curl, or an API client.</p>
        <div class="links">
          <a class="link" href="/api/health">Health</a>
          <a class="link" href="/api/constants">Constants</a>
          <a class="link" href="/api/equations">Equations</a>
          <a class="link" href="/api/landers">Landers</a>
          <a class="link" href="/api/sessions">Sessions</a>
          <a class="link" href="/api">JSON Directory</a>
        </div>
        <ul>${routeList}</ul>
      </section>
    </main>
  </body>
</html>`;
}

function buildStateFromBlackboard(blackboard, lander, previousState = null) {
  const snapshot = blackboard.getSnapshot();

  return {
    altitude: snapshot.altitude,
    velocity: snapshot.velocity,
    fuel: snapshot.fuel,
    emptyMass: snapshot.emptyMass,
    mass: snapshot.mass,
    maxThrust: snapshot.maxThrust,
    fuelConsumptionRate: lander.fuel_consumption_rate,
    time: snapshot.missionTime,
    gravity: snapshot.gravity,
    acceleration: snapshot.acceleration,
    accelerationMagnitude: snapshot.accelerationMagnitude,
    thrust: snapshot.thrust,
    thrustPercent: snapshot.thrustPercent,
    fuelUsed: previousState ? Math.max(0, previousState.fuel - snapshot.fuel) : 0,
    timeToImpact: snapshot.timeToImpact,
    hasLanded: snapshot.hasLanded,
    landingResult: snapshot.landingResult,
    touchdownVelocity: snapshot.touchdownVelocity,

    position: snapshot.position,
    velocityVector: snapshot.velocityVector,
    phase: snapshot.phase,
    health: snapshot.health,
    thermalLoad: snapshot.thermalLoad,
    structuralIntegrity: snapshot.structuralIntegrity,
    warnings: snapshot.warnings,
    plannedPath: snapshot.plannedPath,
    actualPath: snapshot.actualPath,
    optimalBrakingAltitude: snapshot.optimalBrakingAltitude,
    fuelPercentage: snapshot.fuelPercentage,
    fuelCapacity: snapshot.fuelCapacity
  };
}

function buildLegacyInitialState(lander, startAltitude, startVelocity) {
  const gravity = calculateGravity(startAltitude);
  const fuel = lander.fuel_capacity;

  return {
    altitude: startAltitude,
    velocity: startVelocity,
    fuel,
    emptyMass: lander.empty_mass,
    mass: lander.empty_mass + fuel,
    maxThrust: lander.max_thrust,
    fuelConsumptionRate: lander.fuel_consumption_rate,
    time: 0,
    gravity,
    acceleration: 0,
    thrust: 0,
    thrustPercent: 0,
    fuelUsed: 0,
    timeToImpact: calculateTimeToImpact(startAltitude, startVelocity, gravity),
    hasLanded: false,
    landingResult: null,
    touchdownVelocity: null,
    fuelPercentage: 100,
    fuelCapacity: fuel
  };
}

// ============================================
// API Routes
// ============================================

app.get('/', (req, res) => {
  res.type('html').send(renderApiHome());
});

app.get('/api', (req, res) => {
  res.json({
    name: 'Lunar Lander API',
    status: 'ok',
    routes: apiDirectory
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// Physical Constants
// ============================================

app.get('/api/constants', (req, res) => {
  try {
    const constants = queries.getAllConstants();
    res.json(constants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Equations
// ============================================

app.get('/api/equations', (req, res) => {
  try {
    const equations = queries.getAllEquations();
    res.json(equations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/equations/:category', (req, res) => {
  try {
    const equations = queries.getEquationsByCategory(req.params.category);
    res.json(equations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Lander Configurations
// ============================================

app.get('/api/landers', (req, res) => {
  try {
    const landers = queries.getAllLanders();
    res.json(landers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/landers/:id', (req, res) => {
  try {
    const lander = queries.getLanderById(parseInt(req.params.id));
    if (!lander) {
      return res.status(404).json({ error: 'Lander configuration not found' });
    }
    res.json(lander);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Simulation Management
// ============================================

// Create new simulation session
app.post('/api/simulation/start', (req, res) => {
  try {
    const {
      landerId = 1,
      startAltitude = 100000,
      startVelocity = 50,
      mode = 'manual',
      useAdvanced = true  // Use new Blackboard system
    } = req.body;

    // Get lander configuration
    const lander = queries.getLanderById(landerId);
    if (!lander) {
      return res.status(404).json({ error: 'Lander configuration not found' });
    }

    const sessionId = uuidv4();
    
    const initialBlackboardConfig = {
      emptyMass: lander.empty_mass,
      fuelCapacity: lander.fuel_capacity,
      maxThrust: lander.max_thrust,
      fuelConsumptionRate: lander.fuel_consumption_rate,
      startAltitude,
      startVelocity,
      orbitalVelocity: 0,
      mode
    };

    const blackboard = useAdvanced ? new Blackboard(initialBlackboardConfig) : null;
    const initialState = useAdvanced
      ? buildStateFromBlackboard(blackboard, lander)
      : buildLegacyInitialState(lander, startAltitude, startVelocity);

    // Store in database
    queries.createSession({
      id: sessionId,
      lander_config_id: landerId,
      start_altitude: startAltitude,
      start_velocity: startVelocity,
      start_fuel: lander.fuel_capacity,
      mode,
      status: 'active',
      created_at: new Date().toISOString()
    });

    // Store in memory for active simulation
    activeSimulations.set(sessionId, {
      blackboard,
      state: initialState,
      lander,
      mode,
      useAdvanced,
      initialMode: mode,
      initialBlackboardConfig,
      initialState: { ...initialState },
      history: [{ ...initialState }]
    });

    // Log initial telemetry
    logTelemetry(sessionId, initialState);

    res.json({
      sessionId,
      state: initialState,
      lander,
      mode,
      constants: CONSTANTS,
      advanced: useAdvanced
    });
  } catch (error) {
    console.error('Error starting simulation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Step simulation
app.post('/api/simulation/:sessionId/step', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { thrustPercent = 0, dt = 1 } = req.body;

    const simulation = activeSimulations.get(sessionId);
    if (!simulation) {
      return res.status(404).json({ error: 'Simulation session not found' });
    }

    if (simulation.state.hasLanded) {
      return res.json({
        state: simulation.state,
        message: 'Simulation has ended - lander has touched down'
      });
    }

    let newState = simulation.state;
    let actualThrust = 0;
    const requestedDt = Math.max(0.01, Number.isFinite(dt) ? dt : 1);
    let remainingDt = requestedDt;
    const startingFuel = simulation.state.fuel;

    while (remainingDt > 1e-9 && !newState.hasLanded) {
      const currentDt = Math.min(MAX_PHYSICS_SUBSTEP, remainingDt);

      if (simulation.blackboard) {
        const blackboard = simulation.blackboard;

        actualThrust = simulation.mode === 'auto'
          ? optimalAutopilotThrust(blackboard, currentDt)
          : thrustPercent;

        simulationStep(blackboard, actualThrust, currentDt);
        newState = buildStateFromBlackboard(blackboard, simulation.lander, newState);
      } else {
        actualThrust = simulation.mode === 'auto'
          ? simpleAutopilotThrust(newState)
          : thrustPercent;

        newState = legacySimulationStep(newState, actualThrust, currentDt);
        newState.fuelCapacity = simulation.lander.fuel_capacity;
      }

      remainingDt -= currentDt;
    }

    newState.fuelUsed = Math.max(0, startingFuel - newState.fuel);
    
    simulation.state = newState;
    simulation.history.push({ ...newState });

    // Log telemetry
    logTelemetry(sessionId, newState);

    // Update session if landed
    if (newState.hasLanded) {
      queries.updateSession(sessionId, {
        status: 'completed',
        result: newState.landingResult?.rating || 'unknown',
        final_velocity: newState.touchdownVelocity ?? newState.velocity,
        ended_at: new Date().toISOString()
      });
    }

    res.json({
      state: newState,
      autopilotThrust: simulation.mode === 'auto' ? actualThrust : undefined
    });
  } catch (error) {
    console.error('Error stepping simulation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get simulation state
app.get('/api/simulation/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const simulation = activeSimulations.get(sessionId);
    
    if (!simulation) {
      const session = queries.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Simulation session not found' });
      }
      return res.json({ session, active: false });
    }

    res.json({
      state: simulation.state,
      lander: simulation.lander,
      mode: simulation.mode,
      historyLength: simulation.history.length,
      active: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get simulation history/telemetry
app.get('/api/simulation/:sessionId/telemetry', (req, res) => {
  try {
    const { sessionId } = req.params;
    const telemetry = queries.getTelemetry(sessionId);
    res.json(telemetry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set simulation mode
app.post('/api/simulation/:sessionId/mode', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { mode } = req.body;

    const simulation = activeSimulations.get(sessionId);
    if (!simulation) {
      return res.status(404).json({ error: 'Simulation session not found' });
    }

    if (!['manual', 'auto'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Use "manual" or "auto"' });
    }

    simulation.mode = mode;
    if (simulation.blackboard) {
      simulation.blackboard.control.mode = mode;
    }
    queries.updateSession(sessionId, { mode });

    res.json({ mode, message: `Switched to ${mode} mode` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset simulation
app.post('/api/simulation/:sessionId/reset', (req, res) => {
  try {
    const { sessionId } = req.params;
    const simulation = activeSimulations.get(sessionId);
    
    if (!simulation) {
      return res.status(404).json({ error: 'Simulation session not found' });
    }

    simulation.mode = simulation.initialMode;

    if (simulation.blackboard) {
      simulation.blackboard.reset(simulation.initialBlackboardConfig);
      simulation.state = buildStateFromBlackboard(simulation.blackboard, simulation.lander);
    } else {
      simulation.state = { ...simulation.initialState };
    }

    simulation.history = [{ ...simulation.state }];
    queries.updateSession(sessionId, {
      mode: simulation.mode,
      status: 'active',
      result: null,
      final_velocity: null,
      ended_at: null
    });

    res.json({ state: simulation.state, message: 'Simulation reset' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Physics Calculations API
// ============================================

app.post('/api/physics/gravity', (req, res) => {
  const { altitude } = req.body;
  const gravity = physics.calculateGravity(altitude);
  res.json({ altitude, gravity });
});

app.post('/api/physics/time-to-impact', (req, res) => {
  const { altitude, velocity } = req.body;
  const gravity = physics.calculateGravity(altitude);
  const timeToImpact = physics.calculateTimeToImpact(altitude, velocity, gravity);
  res.json({ altitude, velocity, gravity, timeToImpact });
});

// ============================================
// Session History
// ============================================

app.get('/api/sessions', (req, res) => {
  try {
    const sessions = queries.getAllSessions();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Helper Functions
// ============================================

function logTelemetry(sessionId, state) {
  try {
    queries.logTelemetry({
      session_id: sessionId,
      timestamp: state.time,
      altitude: state.altitude,
      velocity: state.velocity,
      acceleration: state.acceleration,
      fuel_remaining: state.fuel,
      thrust: state.thrust,
      mass: state.mass,
      gravity: state.gravity
    });
  } catch (error) {
    console.error('Error logging telemetry:', error);
  }
}

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log(`
  🚀 Lunar Lander Simulation Server
  ================================
  Server running on http://localhost:${PORT}
  
  API Endpoints:
  - GET  /api/health            - Health check
  - GET  /api/constants         - Physical constants from database
  - GET  /api/equations         - Physics equations from database
  - GET  /api/landers           - Lander configurations
  - POST /api/simulation/start  - Start new simulation
  - POST /api/simulation/:id/step - Step simulation forward
  - GET  /api/simulation/:id    - Get simulation state
  
  Physics Equations (reference data):
  • g(h) = G × M_moon / (R_moon + h)²
  • a_net = F_thrust / m - g(h)
  • v_new = v_old - a_net × Δt
  • h_new = h_old - v_old × Δt + 0.5 × a_net × Δt²
  
  Safe landing velocity: 0-5 m/s
  `);
});

export default app;
