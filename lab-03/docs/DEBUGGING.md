# Debugging exercise

The faculty's broken project contains four problems. A copy with the same four problems is in `debugging/broken/`, and `debugging/fixes.diff` shows every line that changed.
Reproduce them with: `cd debugging/broken && node server.js` (it uses its own in-memory database; it finds the packages in `../../node_modules`, so run `npm install` in `lab-03` first).

General method: **read the error from the top**, find the file and line, form a guess, change one thing, run again.

## 1. Wrong import path

**Symptom:** the server does not start.

```text
Error: Cannot find module './route/books'
Require stack:
- .../app.js
- .../server.js
```

**Cause:** `app.js` has `require("./route/books")`, but the folder is named `routes`. The require stack tells which file contains the wrong line (`app.js`).
**Fix:** `require("./routes/books")`. Also check upper/lower case: file names are case-sensitive on Linux and on cloud servers, even if Windows ignores it.

## 2. Port conflict (EADDRINUSE)

**Symptom:** starting a second copy of the server crashes.

```text
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

**Cause:** only one program can listen on a port. An earlier `node server.js` (often a forgotten terminal) still holds port 3000.
**Fix:** stop the old process, or run on another port.

```bash
# macOS / Linux
lsof -i :3000          # find the PID
kill <PID>
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
# or simply
PORT=3001 npm start
```

`server.js` also reads `PORT` from the environment and prints a friendly message when the port is taken.

## 3. Table-name typo (no such table)

**Symptom:** `GET /books` returns `500 {"message":"Internal server error"}`. The server terminal shows the real cause:

```text
[Error: SQLITE_ERROR: no such table: book] { errno: 1, code: 'SQLITE_ERROR' }
```

**Cause:** the query says `FROM book`, the table is `books`.
**Fix:** `SELECT COUNT(*) AS total FROM books ...`. To check the real table names: `sqlite3 data/books.db ".tables"`. The client only sees a generic 500 message (internal details are not leaked); the log has the detail.

## 4. Missing `await`

**Symptom:** `GET /books/1` returns `200 OK` but `"data": {}`, and `GET /books/99999` also returns `200` instead of `404`.

**Cause:** `db.get()` returns a **Promise**. Without `await`, `book` holds the Promise object, not the row. `res.json(promise)` prints `{}`, and `if (!book)` is never true because a Promise is always truthy.
**Fix:**

```js
const book = await db.get("SELECT id, title, author, price FROM books WHERE id = ?", [req.bookId]);
```

The route handler must be `async`. Every `db.get`, `db.all`, `db.run` and `db.exec` call needs `await`.

## Checking the fix

After the four fixes both requests behave correctly (see `screenshots/23-debug-after-fix.png`) and the complete test suite passes (`npm test`, 56 tests).
