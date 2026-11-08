// server.js - entry point: loads .env, opens the database and starts listening.
require("dotenv").config({ quiet: true });
const { openDb } = require("./db");
const { seedBooks } = require("./seed");
const { createApp } = require("./app");

const PORT = Number(process.env.PORT) || 3000;

async function main() {
  const db = await openDb();

  if (process.env.AUTO_SEED !== "false") {
    const added = await seedBooks(db);
    if (added) console.log(`Seeded ${added} sample books.`);
  }

  const app = createApp(db);

  // A port conflict (EADDRINUSE) gets a clear message instead of a stack trace.
  // Express 5 passes the error to the listen callback; Express 4 emits an
  // "error" event on the server. Both paths use this one function.
  const onListenError = (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Stop the other process or set a different PORT in .env.`);
    } else {
      console.error("Server error:", err.message);
    }
    process.exit(1);
  };

  const server = app.listen(PORT, (err) => {
    if (err) return onListenError(err);
    console.log(`Server running at http://localhost:${PORT}`);
  });
  server.on("error", onListenError);

  const shutdown = () => {
    server.close(async () => {
      await db.close();
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});
