// routes/books.js - the /books resource. Nouns in the URL, HTTP method = action.
const express = require("express");
const { sendError, sendSuccess, asyncHandler } = require("../utils/respond");
const { validateBookBody, validateId, validateListQuery } = require("../middleware/validate");

function createBooksRouter(db) {
  const router = express.Router();

  // GET /books - search, filter, sort and paginate
  router.get(
    "/",
    validateListQuery,
    asyncHandler(async (req, res) => {
      const { search_q, min_price, max_price, order_by, order, limit, offset } = req.listQuery;

      // Build the WHERE clause. Values always go in as "?" parameters (never
      // concatenated). order_by / order cannot be parameters, so they are
      // checked against a whitelist in validateListQuery before being used.
      const conditions = [];
      const params = [];

      if (search_q) {
        // Escape LIKE wildcards typed by the user so "50%" is searched literally.
        const escaped = search_q.replace(/[\\%_]/g, "\\$&");
        conditions.push("title LIKE ? ESCAPE '\\'");
        params.push(`%${escaped}%`);
      }
      if (min_price !== null && max_price !== null) {
        conditions.push("price BETWEEN ? AND ?");
        params.push(min_price, max_price);
      } else if (min_price !== null) {
        conditions.push("price >= ?");
        params.push(min_price);
      } else if (max_price !== null) {
        conditions.push("price <= ?");
        params.push(max_price);
      }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      // Text columns sort case-insensitively (A-Z, not "Z before a").
      const sortColumn = order_by === "title" || order_by === "author" ? `${order_by} COLLATE NOCASE` : order_by;

      const { total } = await db.get(`SELECT COUNT(*) AS total FROM books ${where}`, params);
      const books = await db.all(
        `SELECT id, title, author, price FROM books ${where}
         ORDER BY ${sortColumn} ${order}, id ASC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      return sendSuccess(res, 200, "Books fetched successfully", books, {
        pagination: { total, count: books.length, limit, offset },
      });
    })
  );

  // GET /books/:id - one book
  router.get(
    "/:id",
    validateId,
    asyncHandler(async (req, res) => {
      const book = await db.get("SELECT id, title, author, price FROM books WHERE id = ?", [req.bookId]);
      if (!book) return sendError(res, 404, `Book with id ${req.bookId} not found`);
      return sendSuccess(res, 200, "Book fetched successfully", book);
    })
  );

  // POST /books - create
  router.post(
    "/",
    validateBookBody,
    asyncHandler(async (req, res) => {
      const { title, author, price } = req.book;
      const result = await db.run("INSERT INTO books (title, author, price) VALUES (?, ?, ?)", [
        title,
        author,
        price,
      ]);
      const created = await db.get("SELECT id, title, author, price FROM books WHERE id = ?", [
        result.lastID,
      ]);
      res.location(`/books/${created.id}`);
      return sendSuccess(res, 201, "Book created successfully", created);
    })
  );

  // PUT /books/:id - replace title, author and price of an existing book
  router.put(
    "/:id",
    validateId,
    validateBookBody,
    asyncHandler(async (req, res) => {
      const { title, author, price } = req.book;
      const result = await db.run("UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?", [
        title,
        author,
        price,
        req.bookId,
      ]);
      if (result.changes === 0) return sendError(res, 404, `Book with id ${req.bookId} not found`);
      return sendSuccess(res, 200, "Book updated successfully", { id: req.bookId, title, author, price });
    })
  );

  // DELETE /books/:id
  router.delete(
    "/:id",
    validateId,
    asyncHandler(async (req, res) => {
      const book = await db.get("SELECT id, title, author, price FROM books WHERE id = ?", [req.bookId]);
      if (!book) return sendError(res, 404, `Book with id ${req.bookId} not found`);
      await db.run("DELETE FROM books WHERE id = ?", [req.bookId]);
      return sendSuccess(res, 200, "Book deleted successfully", book);
    })
  );

  return router;
}

module.exports = { createBooksRouter };
