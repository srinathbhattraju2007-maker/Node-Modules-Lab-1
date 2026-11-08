// db.js - opens the SQLite database and makes sure the books table exists.
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const DEFAULT_DB_PATH = path.join(__dirname, "data", "books.db");

async function openDb(filename = process.env.DB_PATH || DEFAULT_DB_PATH) {
  // Create the folder for the database file if it does not exist yet.
  if (filename !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
  }

  const db = await open({ filename, driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      title  TEXT    NOT NULL,
      author TEXT    NOT NULL,
      price  REAL    NOT NULL CHECK (price >= 0)
    )
  `);

  return db;
}

module.exports = { openDb };
