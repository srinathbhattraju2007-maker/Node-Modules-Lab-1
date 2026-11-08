// app.js - builds the Express app. Kept separate from server.js so the tests
// can use it without opening a network port.
const express = require("express");
const { createBooksRouter } = require("./routes/books");
const { sendError, sendSuccess } = require("./utils/respond");

function createApp(db) {
  const app = express();
  app.use(express.json({ limit: "100kb" }));

  app.get("/", (req, res) =>
    sendSuccess(res, 200, "Books REST API is running", {
      name: "Backend Development Fundamentals - Lab 3",
      endpoints: ["GET /books", "GET /books/:id", "POST /books", "PUT /books/:id", "DELETE /books/:id"],
    })
  );

  app.get("/health", (req, res) => sendSuccess(res, 200, "OK", { status: "up" }));

  app.use("/books", createBooksRouter(db));

  // Unknown URL -> 404 in the same JSON shape
  app.use((req, res) => sendError(res, 404, `Route ${req.method} ${req.originalUrl} not found`));

  // Central error handler (must have 4 parameters)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") return sendError(res, 400, "Invalid JSON in request body");
    if (err.type === "entity.too.large") return sendError(res, 413, "Request body is too large");
    console.error(err);
    return sendError(res, 500, "Internal server error");
  });

  return app;
}

module.exports = { createApp };
