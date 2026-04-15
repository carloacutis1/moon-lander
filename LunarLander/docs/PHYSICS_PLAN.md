# Lunar Lander Physics Plan

## Overview

This document describes the physics model for the lunar descent simulation and the rationale for design decisions.

## Scenario: Vertical Descent from 100 km

**Default conditions:**
- Altitude: 100,000 m (100 km)
- Initial velocity: 50 m/s toward surface (downward)
- No horizontal/orbital velocity (simplified vertical descent)

**Why no orbital velocity:** A full orbital descent (1680 m/s tangential at 100 km) requires different flight dynamics. The autopilot and physics are tuned for vertical descent. Orbital scenarios can be added later.

## Physics Equations

### Gravity (altitude-dependent)
```
g(h) = G × M_moon / (R_moon + h)²
```
At 100 km: g ≈ 1.448505 m/s². At 20 km: g ≈ 1.583180 m/s². At the surface: g ≈ 1.619784 m/s².

### Equations of Motion (constant acceleration over Δt)
```
a_net = (F_thrust - m·g) / m
v_new = v_old - a_net × Δt     (positive v = falling)
h_new = h_old - v_old×Δt + 0.5×a_net×Δt²
```

### Fuel Consumption
```
fuel_used = mdot_max × throttle × Δt
```
Each lander configuration provides its own maximum fuel burn rate. For the Apollo-style training lander in this repo, 45,000 N corresponds to 15 kg/s at full throttle.

## Fuel Budget for 100 km descent

**Apollo LM:** empty mass 2150 kg, fuel 8200 kg, max thrust 45,000 N

1. **Freefall phase** (save fuel): Coast from 100 km to ~58 km
   - Distance: ~42 km. Final velocity: v = √(v₀² + 2gΔh) ≈ √(2500 + 2×1.6×42000) ≈ 370 m/s
   - Time: ~4 minutes (no fuel used)

2. **Braking phase**: Constant thrust from ~58 km to surface
   - Net deceleration at full throttle: a = F/m - g ≈ 45000/10350 - 1.6 ≈ 2.75 m/s²
   - Stopping distance from 370 m/s: d = v²/(2a) ≈ 25 km
   - We have 58 km → sufficient margin
   - Burn time: t = v/a ≈ 135 s. Fuel: ~15×135 ≈ 2000 kg

3. **Conclusion:** 8200 kg fuel is ample. Typical landing uses 2000–3000 kg.

## Optimal Descent Strategy

**Two-phase approach:**
1. **Coast:** Zero thrust until altitude ≈ optimal braking altitude
2. **Brake:** Follow velocity profile: v_target(h) = √(2·(a_max - g)·h) × safety_margin

**Optimal braking altitude** (from energy):
- Let `A = max_thrust / mass`
- With initial downward velocity `v0`, the braking start altitude is:
  `d_c = (v0² + 2·g·H) / (2·A)`
- For the default Apollo-style configuration at 100 km with `v0 = 50 m/s`, `d_c ≈ 37.5 km`

The planning calculation uses a constant-gravity approximation for the idealized profile. The runtime simulation still uses altitude-dependent gravity at every step.

## Autopilot Logic

1. **Coast zone** (h > 1.2 × optimal_braking_altitude): Thrust = 0
2. **Pre-brake zone** (h approaching d_c): Light thrust if v exceeds max safe velocity
3. **Braking zone** (h ≤ 1.2 × d_c): Target velocity profile
   - v_target = √(2·(a_net)·h)·0.85 + 1.5  (smooth approach to 1.5 m/s)
   - Thrust = hover + K_p·(v - v_target) with saturation
4. **Terminal phase** (h < 15 m): Hover thrust × 0.95 for soft touchdown

## Landing Criteria

| Velocity | Rating | Description |
|----------|--------|-------------|
| 0–2 m/s  | Perfect | "The Eagle has landed" |
| 2–4 m/s  | Good | Safe landing |
| 4–5 m/s  | Hard | Within limits, minor damage possible |
| 5–10 m/s | Crash (survivable) | Significant damage |
| >10 m/s  | Crash (fatal) | Mission failed |

## Simulation Timestep

- Default: 1 second per step (real-time feel)
- The runtime integrates exact touchdown timing inside each step when surface contact happens partway through the interval
- API requests with larger `dt` values are subdivided into 1-second physics slices so manual and autopilot behavior remain consistent during fast-forwarded runs
- Autopilot is tuned around 1 Hz control updates, with larger requested timesteps internally decomposed before control is applied
