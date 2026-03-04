# moon-lander
land on the moon with team lightsaber.
## Moon Lander Database Workflow

### Setup
1. Run `populate_db.sql` in SQLite to create tables and insert initial data.
2. Use your C++ code in the `CPP` folder to read/update data in `moon_lander.db`.

### Files

### Removed Files

### Example (SQLite CLI)
```sh
sqlite3 moon_lander.db < populate_db.sql
```

### Example (C++)
Use [SQLite C++ wrapper](https://github.com/sqlite/sqlite) or [sqlite3.h](https://www.sqlite.org/capi3ref.html) to connect, query, and update.

This workflow is now streamlined for C++ integration.

# 🚀 Team Lightsaber Lunar Module Simulation

A lunar module descent simulation built with React, Node.js/Express, and SQLite. This repo features realistic physics, automatic/manual controls, and authentic mission control aesthetics.

![Lunar Lander Simulation](https://images-assets.nasa.gov/image/as11-40-5903/as11-40-5903~medium.jpg)

## Features

  - Altitude-dependent gravity: `g = G × M_moon / (R_moon + h)²`
  - Mass-aware acceleration with fuel consumption
  - Accurate velocity and position integration
  
    
  - Apollo LM-style lander
  - Dynamic thrust flame effects
  - Moon surface with craters
  - Earth visible in background
  - Mission Control-style telemetry displays

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


## Getting Started

### Prerequisites


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
