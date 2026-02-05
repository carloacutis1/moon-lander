# 🚀 Team Lightsaber Lunar Module Simulation

A lunar module descent simulation built with React, Node.js/Express, and SQLite. This repo features realistic physics, automatic/manual controls, and authentic mission control aesthetics.

![Lunar Lander Simulation](https://images-assets.nasa.gov/image/as11-40-5903/as11-40-5903~medium.jpg)

## Features

- **Realistic Physics Engine**: Based on actual lunar gravitational equations
  - Altitude-dependent gravity: `g = G × M_moon / (R_moon + h)²`
  - Mass-aware acceleration with fuel consumption
  - Accurate velocity and position integration
  
- **SQL Backend**: Physical constants, equations, and lander configurations stored in SQLite
    
- **Realistic Visuals**:
  - Apollo LM-style lander
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
| Gravity at Altitude | `g = G × m_moon / (r_moon + h)²` | Gravitational acceleration varies with altitude |
| Net Acceleration | `a = (F - g × m) / m_avg` | Thrust minus gravity, accounting for mass change |
| Velocity Update | `v_t = v_{t-1} + a × Δt` | Kinematic velocity integration |
| Altitude Update | `h_t = h_{t-1} - v × Δt - 0.5 × a × Δt²` | Position update with acceleration |

## Physical Constants

- **G** = 6.67430 × 10⁻¹¹ N·m²/kg² (Gravitational constant)
- **M_moon** = 7.34767309 × 10²² kg (Moon mass)
- **R_moon** = 1,740,000 m (Moon radius)
- **g_surface** ≈ 1.62 m/s² (Surface gravity)
- **Safe landing velocity**: 0-5 m/s

## Getting Started

### Prerequisites

- Node.js
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

## License

MIT License - Educational/Simulation purposes

## Acknowledgments

- NASA Apollo Program documentation
- Space Academy lunar simulation reference
- Original Lunar Lander game (Atari, 1979)
