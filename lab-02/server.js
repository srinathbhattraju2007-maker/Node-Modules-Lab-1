
const express = require("express");
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "books.db");
const PORT = 3000;

let db;

// GET all books
app.get("/books/", async (req, res) => {
    const books = await db.all("SELECT * FROM book");
    res.status(200).json(books);
});

// GET one book
app.get("/books/:bookId/", async (req, res) => {
    const { bookId } = req.params;
    const book = await db.get(
        "SELECT * FROM book WHERE id = ?",
        [bookId]
    );

    if (!book) {
        return res.status(404).send("Book Not Found");
    }

    res.status(200).json(book);
});

// POST a new book
app.post("/books/", async (req, res) => {
    const { title, author, price, pages } = req.body;

    if (!title || !author || price == null || pages == null) {
        return res.status(400).send("All book fields are required");
    }

    const result = await db.run(
        `INSERT INTO book (title, author, price, pages)
         VALUES (?, ?, ?, ?)`,
        [title, author, price, pages]
    );

    res.status(201).json({
        message: "Book Added Successfully",
        bookId: result.lastID
    });
});

// PUT to update a book
app.put("/books/:bookId/", async (req, res) => {
    const { bookId } = req.params;
    const { title, author, price, pages } = req.body;

    if (!title || !author || price == null || pages == null) {
        return res.status(400).send("All book fields are required");
    }

    const result = await db.run(
        `UPDATE book
         SET title = ?, author = ?, price = ?, pages = ?
         WHERE id = ?`,
        [title, author, price, pages, bookId]
    );

    if (result.changes === 0) {
        return res.status(404).send("Book Not Found");
    }

    res.status(200).send("Book Updated Successfully");
});

// DELETE a book
app.delete("/books/:bookId/", async (req, res) => {
    const { bookId } = req.params;

    const result = await db.run(
        "DELETE FROM book WHERE id = ?",
        [bookId]
    );

    if (result.changes === 0) {
        return res.status(404).send("Book Not Found");
    }

    res.status(200).send("Book Deleted Successfully");
});

// Initialize database before starting server
async function initializeDBAndServer() {
    try {
        db = await sqlite.open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Unable to start server:", error.message);
        process.exit(1);
    }
}

initializeDBAndServer();
