const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'ctrps.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite Database.');
});

db.serialize(() => {
  // 1. Users Table (SRS 4.1)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      college_id TEXT,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      role TEXT NOT NULL,
      department TEXT,
      password TEXT NOT NULL
    )
  `);

  // 2. Routes Table (SRS 4.2 & Map Coordinates Support)
  db.run(`
    CREATE TABLE IF NOT EXISTS routes (
      route_id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_name TEXT NOT NULL,
      source TEXT NOT NULL,
      destination TEXT NOT NULL,
      stops TEXT,
      bus_no TEXT,
      time TEXT,
      fee TEXT,
      coordinates TEXT,
      status TEXT DEFAULT 'active'
    )
  `);

  // Auto-migration: Add coordinates column if table already exists
  db.run(`ALTER TABLE routes ADD COLUMN coordinates TEXT`, (err) => {
    // Column already exists error is ignored safely
  });

  // 3. Passes Table (SRS 4.3 & 4.4 Extended Fields)
  db.run(`
    CREATE TABLE IF NOT EXISTS passes (
      pass_id INTEGER PRIMARY KEY AUTOINCREMENT,
      req_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      college_id TEXT NOT NULL,
      category TEXT NOT NULL,
      department TEXT,
      route TEXT NOT NULL,
      boarding_point TEXT,
      duration TEXT,
      phone TEXT,
      address TEXT,
      status TEXT DEFAULT 'Under Review',
      remarks TEXT DEFAULT '',
      applied_on TEXT NOT NULL
    )
  `);

  // Seed Default Routes with Coordinates if Table is Empty
  db.get("SELECT COUNT(*) as count FROM routes", (err, row) => {
    if (row && row.count === 0) {
      const stmt = db.prepare(
        `INSERT INTO routes (route_name, source, destination, stops, bus_no, time, fee, coordinates) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      
      stmt.run(
        "Central Park Express",
        "Central Park",
        "College",
        "Central Park -> City Center -> College",
        "WB-04-1234",
        "08:00 AM",
        "₹1,200/mo",
        JSON.stringify([[22.5726, 88.3639], [22.5780, 88.3700], [22.5850, 88.3800]])
      );

      stmt.run(
        "Tech Corridor Route",
        "Tech Hub",
        "College",
        "Tech Hub -> North Avenue -> College",
        "WB-04-5678",
        "08:15 AM",
        "₹1,500/mo",
        JSON.stringify([[22.5690, 88.4320], [22.5750, 88.4200], [22.5850, 88.3800]])
      );

      stmt.run(
        "Metro Connector",
        "Central Metro",
        "College",
        "Central Metro -> Sector 5 -> College",
        "WB-04-9900",
        "08:30 AM",
        "₹1,000/mo",
        JSON.stringify([[22.5800, 88.4100], [22.5820, 88.3950], [22.5850, 88.3800]])
      );

      stmt.finalize();
      console.log('Default routes with coordinates seeded successfully.');
    }
  });
});

module.exports = db;