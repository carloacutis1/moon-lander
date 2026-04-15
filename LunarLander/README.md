# 🚀 Lunar Lander Simulation

A NASA-style lunar lander descent simulation built with React and Node.js/Express. It uses a JSON-backed reference data store plus in-memory active session state, with realistic lunar descent physics, automatic/manual controls, and mission-control-style telemetry.

![Lunar Lander Simulation](https://images-assets.nasa.gov/image/as11-40-5903/as11-40-5903~medium.jpg)

## Features

- **Realistic Physics Engine**: Based on actual lunar gravitational equations
  - Altitude-dependent gravity: `g = G × M_moon / (R_moon + h)²`
  - Mass-aware acceleration with fuel consumption
  - Accurate velocity and position integration
  
- **Reference Data API**: Physical constants, equations, and lander configurations served from a synchronized JSON-backed store
  
- **Dual Control Modes**:
  - **Manual**: Full control over thrust (0-100%)
  - **Autopilot**: Computer-guided descent algorithm
  
- **Realistic Visuals**:
  - Apollo LM-style lander with gold foil thermal blankets
  - Dynamic thrust flame effects
  - Moon surface with craters
  - Earth visible in background
  - Mission Control-style telemetry displays

- **Complete Telemetry**:
  - Altitude, velocity, acceleration
  - Fuel remaining, total mass
  - Time to impact calculations
  - Local gravitational acceleration

## Physics Equations (from Database)

| Equation | Formula | Description |
|----------|---------|-------------|
| Gravity at Altitude | `g(h) = G × M_moon / (R_moon + h)²` | Gravitational acceleration varies with altitude |
| Net Radial Acceleration | `a_net = F_thrust / m - g(h)` | Signed radial acceleration using the positive-downward velocity convention |
| Velocity Update | `v_new = v_old - a_net × Δt` | Velocity integration for `v > 0` meaning motion toward the surface |
| Altitude Update | `h_new = h_old - v_old × Δt + 0.5 × a_net × (Δt)²` | Constant-acceleration position update |

## Physical Constants

- **G** = 6.67430 × 10⁻¹¹ N·m²/kg² (Gravitational constant)
- **M_moon** = 7.34767309 × 10²² kg (Moon mass)
- **R_moon** = 1,740,000 m (Moon radius)
- **g_surface** ≈ 1.619784 m/s² (Surface gravity)
- **Safe landing velocity**: 0-5 m/s

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Git Configuration

Before committing changes to your private GitHub repository, configure your Git identity:

```bash
# Set your Git username and email (use the email associated with your GitHub account)
git config user.name "Your Name"
git config user.email "your-email@example.com"

# Add your private GitHub repository as the remote origin
git remote add origin https://github.com/YOUR_USERNAME/LunarLander.git

# Or if using SSH (recommended for private repos)
git remote add origin git@github.com:YOUR_USERNAME/LunarLander.git
```

To commit and push your changes:

```bash
# Stage all changes
git add .

# Commit with a message
git commit -m "Your commit message"

# Push to GitHub (first time, set upstream)
git push -u origin main

# Subsequent pushes
git push
```

> **Note**: For private repositories, you'll need to authenticate. GitHub recommends using:
> - **SSH keys** (add your public key to GitHub Settings → SSH and GPG keys)
> - **Personal Access Token** (for HTTPS, generate at GitHub Settings → Developer settings → Personal access tokens)

### Installation

```bash
# Clone or navigate to the project
cd LunarLander

# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies  
cd ../client && npm install
```

### Running the Application

```bash
# From root directory, run both server and client
npm run dev

# Or run separately:
# Terminal 1 - Backend (port 3001)
cd server && npm run dev

# Terminal 2 - Frontend (port 3000)
cd client && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Controls

| Key | Action |
|-----|--------|
| **SPACE** | Full thrust (hold) |
| **↑ / ↓** | Increase/decrease thrust by 10% |
| **A** | Toggle autopilot mode |
| **P** | Pause/resume simulation |

## API Endpoints

### Simulation
- `POST /api/simulation/start` - Start new simulation
- `POST /api/simulation/:id/step` - Step simulation forward
- `GET /api/simulation/:id` - Get current state
- `POST /api/simulation/:id/mode` - Set control mode

### Data
- `GET /api/constants` - Physical constants
- `GET /api/equations` - Physics equations
- `GET /api/landers` - Lander configurations

## Architecture

```
LunarLander/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── App.jsx
│   │   │   ├── SimulationView.jsx
│   │   │   ├── LunarLander.jsx
│   │   │   ├── TelemetryPanel.jsx
│   │   │   └── ControlPanel.jsx
│   │   └── api/            # API client
│   └── public/
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── index.js        # API server
│   │   ├── database/       # JSON-backed reference data setup
│   │   │   └── db.js
│   │   └── physics/        # Physics engines
│   │       ├── engine.js
│   │       └── advancedEngine.js
│   └── data/               # JSON reference data and session history
│
└── package.json            # Root package
```

## Design Patterns

- **Blackboard Architecture**: Central in-memory mission state object stores the active simulation state
- **Client-Server**: Frontend requests calculations from backend
- **Reference Data Store**: Constants, equations, and lander configurations are synchronized through a JSON-backed store

## Landing Ratings

| Rating | Velocity | Description |
|--------|----------|-------------|
| Perfect | ≤ 2 m/s | "The Eagle has landed" |
| Good | ≤ 4 m/s | Safe landing, crew OK |
| Hard | ≤ 5 m/s | Minor damage possible |
| Crash (Survivable) | ≤ 10 m/s | Significant damage |
| Crash (Fatal) | > 10 m/s | Mission failed |

## License

MIT License - Educational/Simulation purposes

## Acknowledgments

- NASA Apollo Program documentation
- Space Academy lunar simulation reference
- Original Lunar Lander game (Atari, 1979)
