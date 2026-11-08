// utils/respond.js - one place that defines the response shape of the API.
//   success: { "message": "...", "data": ... }   (lists also carry "pagination")
//   failure: { "message": "..." }

function sendError(res, status, message) {
  return res.status(status).json({ message });
}

function sendSuccess(res, status, message, data, extra = {}) {
  return res.status(status).json({ message, data, ...extra });
}

// Wraps an async route so a rejected promise reaches the error handler
// (needed on Express 4; harmless on Express 5).
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { sendError, sendSuccess, asyncHandler };
