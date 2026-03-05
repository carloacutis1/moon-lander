
-- Moon Lander Database Schema & Initial Data

-- SCHEMA
CREATE TABLE IF NOT EXISTS constants (
	constant_id INTEGER PRIMARY KEY AUTOINCREMENT,
	body_name TEXT NOT NULL,
	gravitational_constant REAL NOT NULL,
	body_mass_kg REAL NOT NULL,
	body_radius_m REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS equations (
	equation_id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS landers (
	lander_id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	empty_mass_kg REAL NOT NULL,
	fuel_capacity_kg REAL NOT NULL,
	max_thrust_n REAL NOT NULL,
	burn_rate_kgps REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS simulations (
	simulation_id INTEGER PRIMARY KEY AUTOINCREMENT,
	lander_id INTEGER NOT NULL,
	body_name TEXT NOT NULL,
	time_step_s REAL NOT NULL,
	start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (lander_id) REFERENCES landers(lander_id)
);

CREATE TABLE IF NOT EXISTS simulation_states (
	state_id INTEGER PRIMARY KEY AUTOINCREMENT,
	simulation_id INTEGER NOT NULL,
	time_s REAL NOT NULL,
	altitude_m REAL NOT NULL,
	velocity_mps REAL NOT NULL,
	acceleration_mps2 REAL NOT NULL,
	mass_kg REAL NOT NULL,
	fuel_kg REAL NOT NULL,
	thrust_n REAL NOT NULL,
	FOREIGN KEY (simulation_id) REFERENCES simulations(simulation_id)
);

-- INITIAL DATA
INSERT OR REPLACE INTO constants (body_name, gravitational_constant, body_mass_kg, body_radius_m)
VALUES ('Moon', 1.62, 7.342e22, 1737400);

INSERT OR REPLACE INTO landers (name, empty_mass_kg, fuel_capacity_kg, max_thrust_n, burn_rate_kgps)
VALUES ('Apollo Lander', 900, 120, 4500, 1.2);

INSERT OR IGNORE INTO equations (name, description)
VALUES ('Thrust Equation', 'F = m * a');

-- Example queries
SELECT * FROM landers;
SELECT * FROM constants;
SELECT * FROM equations;

