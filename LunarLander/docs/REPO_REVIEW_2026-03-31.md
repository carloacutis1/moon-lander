# Repository Review - 2026-03-31

## Scope

This review covered:

- Architecture and data flow across the React client and Express server
- Physics equations and consistency between docs, API data, and implementation
- Runtime behavior via client build and server/API smoke tests
- Dead code, stale paths, and misleading configuration/data

No application code was changed as part of this review.

## Verification Performed

- Built the client with `npm run build` in `client/`
- Started the server with `npm start` in `server/`
- Exercised:
  - `GET /api/health`
  - `GET /api/equations`
  - `POST /api/simulation/start`
  - `POST /api/simulation/:sessionId/step`
  - `POST /api/simulation/:sessionId/reset`
- Ran two behavior checks:
  - Autopilot descent from 100 km: landed successfully after 477 s
  - Manual no-thrust descent from 1000 m: produced a crash result

## Highest-Priority Findings

### 1. Reset does not actually reset the simulation engine state

Evidence:

- [server/src/index.js](/Users/river/LunarLander/server/src/index.js#L375) resets only `simulation.state` and `simulation.history`
- The active `blackboard` is not reset or recreated, so the next `step` continues from the old physics state

Observed behavior:

- After one step from 1000 m / 10 m/s, reset returns altitude `1000` and time `0`
- The next step jumps to altitude `976.764...` and time `2`, which proves the old blackboard state is still driving the simulation

How to fix:

- Store the initial simulation config alongside the session
- On reset, either:
  - call `blackboard.reset(initialConfig)` and rebuild the compatibility state from a fresh snapshot, or
  - recreate the entire in-memory simulation object from scratch
- Reset `mode`, `missionTime`, warnings, trajectory, and any cached fields from the same source of truth

### 2. Touchdown velocity is overwritten to `0`, which corrupts results and history

Evidence:

- [server/src/physics/advancedEngine.js](/Users/river/LunarLander/server/src/physics/advancedEngine.js#L346) evaluates landing using a touchdown velocity
- [server/src/physics/advancedEngine.js](/Users/river/LunarLander/server/src/physics/advancedEngine.js#L352) then sets `blackboard.velocity.radial = 0`
- [server/src/index.js](/Users/river/LunarLander/server/src/index.js#L299) stores `final_velocity: newState.velocity`
- [client/src/components/LandingResult.jsx](/Users/river/LunarLander/client/src/components/LandingResult.jsx#L119) displays `state.velocity`

Observed behavior:

- A crash landing still ends with API state `velocity: 0`
- The UI would therefore report `0.00 m/s` touchdown even for a fatal crash
- Session history also stores `final_velocity = 0`

How to fix:

- Preserve impact speed as a separate field such as `touchdownVelocity`
- Use `touchdownVelocity` for:
  - landing evaluation
  - landing result UI
  - session history
  - telemetry/final reporting
- If post-landing physics should freeze motion, keep `velocity.radial = 0` only for the settled state, not as the only recorded touchdown speed

### 3. Fuel percentage in the telemetry UI is mathematically wrong

Evidence:

- [client/src/components/TelemetryPanel.jsx](/Users/river/LunarLander/client/src/components/TelemetryPanel.jsx#L52)
- [client/src/components/TelemetryPanel.jsx](/Users/river/LunarLander/client/src/components/TelemetryPanel.jsx#L59)

Current formula:

- `state.fuel / (state.mass - state.emptyMass + state.fuel) * 100`

Since `state.mass - state.emptyMass === state.fuel`, this simplifies to:

- `state.fuel / (2 * state.fuel) * 100 = 50`

Observed behavior:

- Full tanks display as `50%`
- Half tanks also display as `50%`
- The gauge only becomes `0%` when fuel is exactly zero

How to fix:

- Use `state.fuelPercentage` from the server if present
- Otherwise compute `state.fuel / state.fuelCapacity * 100`

### 4. The public equations and docs disagree with the actual implementation

Evidence:

- [README.md](/Users/river/LunarLander/README.md#L33)
- [server/src/database/db.js](/Users/river/LunarLander/server/src/database/db.js#L89)
- [server/src/index.js](/Users/river/LunarLander/server/src/index.js#L467)
- [server/src/physics/advancedEngine.js](/Users/river/LunarLander/server/src/physics/advancedEngine.js#L257)
- [server/src/physics/engine.js](/Users/river/LunarLander/server/src/physics/engine.js#L75)

Examples:

- README/database say `v_t = v_{t-1} + a * dt`, but the implemented sign convention uses `v_new = v_old - a_net * dt`
- README/database say `h_t = h_{t-1} - v * dt - 0.5 * a * dt^2`, but the implementation uses `+ 0.5 * a * dt^2`
- Database says thrust efficiency is `100 N per kg/s`, while the code uses `3000 N per kg/s`

Why this matters:

- The UI exposes the database equations to users on the start screen
- The server banner prints formulas that do not match runtime behavior

How to fix:

- Pick one sign convention and document it once
- Generate displayed equations from the implementation source of truth instead of hard-coding duplicates
- Add unit tests that verify any exported equation text matches the runtime formulas

### 5. The architecture docs describe a different system than the repo actually runs

Evidence:

- [README.md](/Users/river/LunarLander/README.md#L3) says the app uses SQLite
- [README.md](/Users/river/LunarLander/README.md#L14) says data is stored in SQLite
- [README.md](/Users/river/LunarLander/README.md#L166) labels `db.js` as SQLite setup
- [server/src/database/db.js](/Users/river/LunarLander/server/src/database/db.js#L1) implements JSON-file persistence plus in-memory arrays
- [server/src/index.js](/Users/river/LunarLander/server/src/index.js#L29) stores active simulations in an in-memory `Map`

Actual architecture today:

- React client
- Express API
- Reference/session data stored in JSON
- Active simulation state stored only in process memory

How to fix:

- Either update the docs to describe the current JSON-backed architecture honestly
- Or implement the SQLite-backed design the README claims exists

## Physics Findings

### 6. Gravity at 100 km is documented incorrectly

Evidence:

- [docs/PHYSICS_PLAN.md](/Users/river/LunarLander/docs/PHYSICS_PLAN.md#L18) says `g(100 km) ~= 1.58 m/s^2`

Using the repo's own constants:

- `g(0) = 1.61978 m/s^2`
- `g(20 km) = 1.58318 m/s^2`
- `g(100 km) = 1.44850 m/s^2`

Conclusion:

- `1.58 m/s^2` is approximately correct at 20 km, not 100 km

How to fix:

- Correct the value in the physics plan
- Consider adding a tiny test that checks a few known altitudes against the gravity function

### 7. The "optimal braking altitude" formula in the blackboard is wrong

Evidence:

- [docs/PHYSICS_PLAN.md](/Users/river/LunarLander/docs/PHYSICS_PLAN.md#L60) gives `d_c = gH / A` for the zero-initial-velocity case
- [server/src/blackboard/Blackboard.js](/Users/river/LunarLander/server/src/blackboard/Blackboard.js#L194) computes:
  - `d_c = (v0^2 + 2*g*H) / (2 * (A - g))`

For the default Apollo-like config in the repo:

- `A = thrust / mass = 4.3478 m/s^2`
- Correct energy-balance form with initial downward velocity is:
  - `d_c = (v0^2 + 2*gH) / (2A)`
- That gives about `37.5 km`
- Current blackboard code gives about `59.8 km`

Impact:

- The planned path is non-physical
- The "optimal braking altitude" sent to the UI is misleading
- Autopilot still lands because the controller is conservative, but the marker is not actually optimal

How to fix:

- Replace the denominator with `2 * A`
- Recompute `plannedPath`
- Retune the autopilot thresholds after the correction

### 8. The planned path contains a discontinuity

Evidence:

- [server/src/blackboard/Blackboard.js](/Users/river/LunarLander/server/src/blackboard/Blackboard.js#L222)

Observed from the generated initial path:

- Freefall segment approaches about `36.8 m/s`
- Braking segment immediately jumps to about `56.6 m/s`

That means the plotted "optimal" path is not continuous and cannot represent a real descent profile.

How to fix:

- Fix the braking-altitude formula first
- Then generate phase boundaries so the freefall terminal velocity matches the braking initial velocity

### 9. The Apollo LM numbers are presented as realistic, but the mass model is simplified and not actually Apollo 11 LM mass

Evidence:

- [docs/PHYSICS_PLAN.md](/Users/river/LunarLander/docs/PHYSICS_PLAN.md#L40) uses `empty mass 2150 kg, fuel 8200 kg`
- [server/src/database/db.js](/Users/river/LunarLander/server/src/database/db.js#L162) uses the same simplification

Why this needs review:

- The code's 8200 kg propellant is close to the descent propellant load
- The "empty mass" is not the full landed LM configuration from NASA mission documentation
- This is fine for a training sim, but inaccurate if the repo claims authentic Apollo vehicle specs

How to fix:

- Either relabel this configuration as an Apollo-inspired simplified lander
- Or replace it with a full mass breakdown and document the exact mission phase being modeled

## Medium-Priority Design / Correctness Issues

### 10. Initial snapshot metadata is wrong before the first step

Evidence:

- [server/src/blackboard/Blackboard.js](/Users/river/LunarLander/server/src/blackboard/Blackboard.js#L112) initializes the mission phase to `orbit`
- [server/src/blackboard/Blackboard.js](/Users/river/LunarLander/server/src/blackboard/Blackboard.js#L141) initializes `timeToImpact` to `0`
- [server/src/index.js](/Users/river/LunarLander/server/src/index.js#L137) forwards those values directly into the initial API state

Impact:

- A vertical-descent mission starts in phase `orbit`
- Time-to-impact is shown as `0` until the first step runs

How to fix:

- During start/reset, compute the initial derived fields immediately:
  - phase
  - time to impact
  - any warning or health-derived values needed by the UI

### 11. `useAdvanced` is effectively dead

Evidence:

- [server/src/index.js](/Users/river/LunarLander/server/src/index.js#L113) accepts `useAdvanced`
- [server/src/index.js](/Users/river/LunarLander/server/src/index.js#L185) always stores a `blackboard`
- [server/src/index.js](/Users/river/LunarLander/server/src/index.js#L233) always uses the blackboard path whenever `simulation.blackboard` exists

Observed behavior:

- Starting a session with `useAdvanced: false` still returns advanced blackboard fields and steps through the advanced engine

How to fix:

- Either honor the flag and skip blackboard creation for legacy mode
- Or remove the flag and delete the unused branch

### 12. Per-lander `fuelConsumptionRate` is not actually used by the physics

Evidence:

- [server/src/database/db.js](/Users/river/LunarLander/server/src/database/db.js#L157) stores `fuel_consumption_rate`
- [server/src/blackboard/Blackboard.js](/Users/river/LunarLander/server/src/blackboard/Blackboard.js#L61) accepts it
- [server/src/physics/advancedEngine.js](/Users/river/LunarLander/server/src/physics/advancedEngine.js#L249) ignores it and always uses `THRUST_EFFICIENCY = 3000`

Impact:

- Different lander configs look distinct in data, but their burn model is effectively hard-coded by a global constant

How to fix:

- Decide whether fuel flow is:
  - derived from engine thrust and specific impulse, or
  - lander-specific config data
- Then remove the unused representation

### 13. Simulation mode is not fully synchronized into blackboard state

Evidence:

- [server/src/index.js](/Users/river/LunarLander/server/src/index.js#L366) updates `simulation.mode`
- [server/src/index.js](/Users/river/LunarLander/server/src/index.js#L367) updates the persisted session
- It does not update `simulation.blackboard.control.mode`

How to fix:

- Update both the wrapper session and blackboard state on mode changes
- If mode is only needed at one layer, remove duplication

### 14. Keyboard autopilot toggle likely captures stale state

This is an inference from code review rather than a browser-automated repro.

Evidence:

- [client/src/App.jsx](/Users/river/LunarLander/client/src/App.jsx#L86) registers keyboard listeners in an effect that depends only on `gameState`
- [client/src/App.jsx](/Users/river/LunarLander/client/src/App.jsx#L133) defines `toggleMode` using current React state

Risk:

- The keyboard handler can retain an older `toggleMode` closure and stop reflecting the latest `mode`

How to fix:

- Use a stable event helper such as `useEffectEvent`, or
- include the necessary dependencies so the listener is rebound with fresh state

### 15. Telemetry history is not persisted even though session data is

Evidence:

- [server/src/database/db.js](/Users/river/LunarLander/server/src/database/db.js#L193) saves sessions to disk
- [server/src/database/db.js](/Users/river/LunarLander/server/src/database/db.js#L211) appends telemetry entries but never calls `saveDatabase()`

Impact:

- Telemetry survives only for the current process lifetime
- The repo currently mixes persistent and non-persistent state in a surprising way

How to fix:

- If persistence is intended, save or batch-save telemetry
- If not, document that telemetry is ephemeral

## Dead Code / Cleanup Candidates

### 16. Legacy and duplicate physics paths should be consolidated

Evidence:

- [server/src/physics/engine.js](/Users/river/LunarLander/server/src/physics/engine.js#L1) contains a second physics implementation
- [server/src/physics/advancedEngine.js](/Users/river/LunarLander/server/src/physics/advancedEngine.js#L361) keeps a legacy step function
- [server/src/index.js](/Users/river/LunarLander/server/src/index.js#L279) still keeps the legacy branch even though `useAdvanced` is not honored

Recommendation:

- Choose one engine as the supported path
- Move shared constants and helper formulas into one module

### 17. There are several obvious unused helpers and placeholders

Examples:

- [server/src/physics/advancedEngine.js](/Users/river/LunarLander/server/src/physics/advancedEngine.js#L44) `calculateOrbitalVelocity`
- [server/src/physics/advancedEngine.js](/Users/river/LunarLander/server/src/physics/advancedEngine.js#L186) `simpleAutopilotThrust`
- [client/src/index.css](/Users/river/LunarLander/client/src/index.css#L129) `.thrust-flame`
- [client/src/index.css](/Users/river/LunarLander/client/src/index.css#L219) `.moon-surface`
- [client/src/index.css](/Users/river/LunarLander/client/src/index.css#L230) `.scanlines`
- [client/src/index.css](/Users/river/LunarLander/client/src/index.css#L249) `.glow-border`
- [Test](/Users/river/LunarLander/Test) root placeholder file

Recommendation:

- Run a cleanup pass after the correctness fixes
- Add linting and dead-code detection so these do not accumulate

## Recommended Fix Order

1. Fix reset correctness
2. Preserve touchdown velocity separately from settled post-landing velocity
3. Correct the telemetry fuel-percentage formula
4. Unify runtime equations with README/database/API text
5. Correct blackboard braking-altitude math and regenerate planned-path data
6. Decide whether the repo is officially JSON-backed or SQLite-backed and align docs/code
7. Remove or revive the legacy engine path and the `useAdvanced` flag
8. Add tests for:
   - gravity values at known altitudes
   - reset behavior
   - landing result velocity preservation
   - fuel percentage calculations
   - braking-altitude derivation

## Suggested Test Coverage to Add

- Physics unit tests for `calculateGravity`, velocity update, altitude update, and braking-altitude math
- API integration tests for:
  - start
  - step
  - mode switch
  - reset
  - landing result persistence
- Frontend component tests for:
  - telemetry percentages
  - landing result display values
  - keyboard mode toggle behavior

## External Sources Used for Accuracy Checks

- NASA NTRS, "Apollo Lunar Module Propulsion Systems Overview":
  - https://ntrs.nasa.gov/api/citations/20090016298/downloads/20090016298.pdf
- NASA Apollo 11 Press Kit:
  - https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/A11_PressKit.pdf

These were used only to sanity-check the Apollo propulsion and mass claims in the repo docs/config, not to alter the code.
