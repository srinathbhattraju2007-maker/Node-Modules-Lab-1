
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./books.db", (err) => {
    if (err) {
        console.error("Database error:", err.message);
        return;
    }

    console.log("Connected to SQLite database.");

    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS book (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                author TEXT,
                price INTEGER,
                pages INTEGER
            )
        `);

        db.run(`
            INSERT INTO book (title, author, price, pages)
            SELECT ?, ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1 FROM book WHERE title = ?
            )
        `, ["The Alchemist", "Paulo Coelho", 250, 208, "The Alchemist"]);

        db.run(`
            INSERT INTO book (title, author, price, pages)
            SELECT ?, ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1 FROM book WHERE title = ?
            )
        `, ["Wings of Fire", "A.P.J. Abdul Kalam", 300, 180, "Wings of Fire"]);

        db.run(`
            INSERT INTO book (title, author, price, pages)
            SELECT ?, ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1 FROM book WHERE title = ?
            )
        `, ["Atomic Habits", "James Clear", 450, 320, "Atomic Habits"]);

        db.run(`
            INSERT INTO book (title, author, price, pages)
            SELECT ?, ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1 FROM book WHERE title = ?
            )
        `, ["Rich Dad Poor Dad", "Robert Kiyosaki", 350, 336, "Rich Dad Poor Dad"]);

        db.run(`
            INSERT INTO book (title, author, price, pages)
            SELECT ?, ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1 FROM book WHERE title = ?
            )
        `, ["Ikigai", "Hector Garcia", 280, 194, "Ikigai"]);

        db.run(`
            INSERT INTO book (title, author, price, pages)
            SELECT ?, ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1 FROM book WHERE title = ?
            )
        `, ["The Psychology of Money", "Morgan Housel", 400, 256, "The Psychology of Money"]);

        db.run(`
            INSERT INTO book (title, author, price, pages)
            SELECT ?, ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1 FROM book WHERE title = ?
            )
        `, ["Deep Work", "Cal Newport", 320, 296, "Deep Work"]);

        db.run(`
            INSERT INTO book (title, author, price, pages)
            SELECT ?, ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1 FROM book WHERE title = ?
            )
        `, ["Think and Grow Rich", "Napoleon Hill", 270, 238, "Think and Grow Rich"]);

        db.run(`
            INSERT INTO book (title, author, price, pages)
            SELECT ?, ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1 FROM book WHERE title = ?
            )
        `, ["The Power of Habit", "Charles Duhigg", 380, 371, "The Power of Habit"]);

        db.run(`
            INSERT INTO book (title, author, price, pages)
            SELECT ?, ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1 FROM book WHERE title = ?
            )
        `, ["Zero to One", "Peter Thiel", 330, 210, "Zero to One"], (err) => {
            if (err) {
                console.error("Insert error:", err.message);
            } else {
                console.log("Sample books inserted or already present.");
            }

            db.all("SELECT * FROM book", (err, rows) => {
                if (err) {
                    console.error("Read error:", err.message);
                } else {
                    console.table(rows);
                }

                db.close();
            });
        });
    });
});
