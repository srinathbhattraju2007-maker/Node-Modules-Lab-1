// server.js - entry point: loads .env, opens the database and starts listening.
require("dotenv").config({ quiet: true });
const { openDb } = require("./db");
const { seedBooks } = require("./seed");
const { createApp } = require("./app");

const PORT = 3000;

async function main() {
  const db = await openDb(":memory:");

  if (process.env.AUTO_SEED !== "false") {
    const added = await seedBooks(db);
    if (added) console.log(`Seeded ${added} sample books.`);
  }

  const app = createApp(db);
  app.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Server running at http://localhost:${PORT}`);
  });

}

main().catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});
