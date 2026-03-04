CREATE TABLE constants (
    constant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    body_name TEXT NOT NULL,          
    gravitational_constant REAL NOT NULL,
    body_mass_kg REAL NOT NULL,
    body_radius_m REAL NOT NULL
);

CREATE TABLE equations (
    equation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE landers (
    lander_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    empty_mass_kg REAL NOT NULL,
    fuel_capacity_kg REAL NOT NULL,
    max_thrust_n REAL NOT NULL,
    burn_rate_kgps REAL NOT NULL
);

CREATE TABLE simulations (
    simulation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    lander_id INTEGER NOT NULL,
    body_name TEXT NOT NULL,
    time_step_s REAL NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (lander_id) REFERENCES landers(lander_id)
);

CREATE TABLE simulation_states (
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

CREATE TABLE simulation_results (
    result_id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id INTEGER NOT NULL,

    landed_successfully INTEGER NOT NULL,
    touchdown_time_s REAL,
    final_velocity_mps REAL,
    fuel_remaining_kg REAL,

    FOREIGN KEY (simulation_id) REFERENCES simulations(simulation_id)
);

CREATE TABLE statistics (
    stat_id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id INTEGER NOT NULL,
    max_velocity_mps REAL,
    min_altitude_m REAL,
    total_fuel_used_kg REAL,

    FOREIGN KEY (simulation_id) REFERENCES simulations(simulation_id)
);
