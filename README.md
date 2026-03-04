# moon-lander
land on the moon with team lightsaber.
## Moon Lander Database Workflow

### Setup
1. Run `populate_db.sql` in SQLite to create tables and insert initial data.
2. Use your C++ code in the `CPP` folder to read/update data in `moon_lander.db`.

### Files
- `populate_db.sql`: Contains schema and initial data. Run this once to set up the database.
- `moon_lander.db`: SQLite database file.
- `CPP/`: Your C++ code for interacting with the database.

### Removed Files
- Python and JS populate scripts are no longer needed.

### Example (SQLite CLI)
```sh
sqlite3 moon_lander.db < populate_db.sql
```

### Example (C++)
Use [SQLite C++ wrapper](https://github.com/sqlite/sqlite) or [sqlite3.h](https://www.sqlite.org/capi3ref.html) to connect, query, and update.

---
This workflow is now streamlined for C++ integration.
