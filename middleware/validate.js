// middleware/validate.js - input validation. Bad input => 400 with { message }.
const { sendError } = require("../utils/respond");

const MAX_TEXT_LENGTH = 200;
const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;

/** Returns a finite number for 12, 12.5 or "12.5"; otherwise NaN. */
function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value === "string" && NUMBER_PATTERN.test(value.trim())) return Number(value);
  return NaN;
}

function checkText(value, name, errors) {
  if (value === undefined || value === null) {
    errors.push(`${name} is required`);
    return undefined;
  }
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${name} must be a non-empty string`);
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length > MAX_TEXT_LENGTH) {
    errors.push(`${name} must be at most ${MAX_TEXT_LENGTH} characters`);
    return undefined;
  }
  return trimmed;
}

/** Validates the body of POST /books and PUT /books/:id. Puts clean values in req.book. */
function validateBookBody(req, res, next) {
  const body = req.body;
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return sendError(res, 400, "Request body must be a JSON object (send Content-Type: application/json)");
  }

  const errors = [];
  const title = checkText(body.title, "title", errors);
  const author = checkText(body.author, "author", errors);

  let price;
  if (body.price === undefined || body.price === null) {
    errors.push("price is required");
  } else {
    price = toNumber(body.price);
    if (Number.isNaN(price)) errors.push("price must be a number");
    else if (price < 0) errors.push("price must not be negative");
  }

  if (errors.length > 0) {
    return sendError(res, 400, `Validation failed: ${errors.join("; ")}`);
  }

  req.book = { title, author, price };
  next();
}

/** Validates :id in the URL. Puts the number in req.bookId. */
function validateId(req, res, next) {
  const raw = req.params.id;
  const id = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(id) || id < 1) {
    return sendError(res, 400, "id must be a positive integer");
  }
  req.bookId = id;
  next();
}

const ORDER_BY_COLUMNS = ["id", "title", "author", "price"];
const DEFAULTS = { order_by: "id", order: "ASC", limit: 10, offset: 0 };
const MAX_LIMIT = 100;

/**
 * Validates the query string of GET /books and applies the default values.
 * Result is stored in req.listQuery.
 */
function validateListQuery(req, res, next) {
  const q = req.query;
  const errors = [];

  // Every parameter must appear once and be a string (rejects ?limit=1&limit=2).
  for (const [key, value] of Object.entries(q)) {
    if (typeof value !== "string") errors.push(`${key} must be given only once`);
  }
  if (errors.length > 0) return sendError(res, 400, `Invalid query: ${errors.join("; ")}`);

  const result = { ...DEFAULTS, search_q: "", min_price: null, max_price: null };

  if (q.search_q !== undefined) result.search_q = q.search_q.trim();

  if (q.order_by !== undefined) {
    const column = q.order_by.trim().toLowerCase();
    if (!ORDER_BY_COLUMNS.includes(column)) {
      errors.push(`order_by must be one of: ${ORDER_BY_COLUMNS.join(", ")}`);
    } else {
      result.order_by = column;
    }
  }

  if (q.order !== undefined) {
    const direction = q.order.trim().toUpperCase();
    if (direction !== "ASC" && direction !== "DESC") errors.push("order must be ASC or DESC");
    else result.order = direction;
  }

  if (q.limit !== undefined) {
    const limit = Number(q.limit);
    if (!/^\d+$/.test(q.limit.trim()) || limit < 1 || limit > MAX_LIMIT) {
      errors.push(`limit must be an integer between 1 and ${MAX_LIMIT}`);
    } else {
      result.limit = limit;
    }
  }

  if (q.offset !== undefined) {
    const offset = Number(q.offset);
    if (!/^\d+$/.test(q.offset.trim()) || !Number.isSafeInteger(offset)) {
      errors.push("offset must be an integer >= 0");
    } else {
      result.offset = offset;
    }
  }

  for (const name of ["min_price", "max_price"]) {
    if (q[name] === undefined) continue;
    const value = toNumber(q[name]);
    if (Number.isNaN(value) || value < 0) errors.push(`${name} must be a number >= 0`);
    else result[name] = value;
  }

  if (result.min_price !== null && result.max_price !== null && result.min_price > result.max_price) {
    errors.push("min_price must not be greater than max_price");
  }

  if (errors.length > 0) return sendError(res, 400, `Invalid query: ${errors.join("; ")}`);

  req.listQuery = result;
  next();
}

module.exports = { validateBookBody, validateId, validateListQuery, ORDER_BY_COLUMNS, MAX_LIMIT };
