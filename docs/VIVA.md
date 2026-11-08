# Viva preparation

## Query parameter vs path parameter?

- A **path parameter** is part of the URL path and identifies *one specific resource*: `/books/7` (here `7` is the book's id). It is required; without it the URL is a different route.
- A **query parameter** comes after `?` as `key=value` pairs and *refines or controls a collection*: `/books?search_q=sql&order_by=price&limit=5`. They are optional and have defaults.
- Rule of thumb: path = *which* resource, query = *how* to filter, sort or page the results.
- In Express: `req.params.id` for path parameters, `req.query.limit` for query parameters (always strings, so they must be validated and converted).

## What does stateless mean?

Each request carries everything the server needs to handle it; the server does not remember anything about the client between requests (no session kept in server memory). Two identical requests give the same kind of answer no matter what came before. Benefits: easy to scale (any server instance can answer any request), easy to cache, easy to debug and restart. In this project, `GET /books?limit=5&offset=5` includes the page position in the URL itself rather than the server remembering "page 2". Data that must persist (the books) lives in the database, not in the server process.

## Which status code for bad input vs a missing record?

- **400 Bad Request**: the request itself is wrong: missing title, `price: "abc"`, `limit=abc`, malformed JSON, `/books/abc`.
- **404 Not Found**: the request is well formed, but the record does not exist: `/books/99999`.
- Others used in this lab: **200** for success, **201** after creating a resource, **500** for unexpected server errors.

## Other questions to be ready for

- **Why are endpoints nouns?** The URL names the resource (`/books`); the HTTP method is the verb: GET reads, POST creates, PUT replaces, DELETE removes.
- **Why 201 and not 200 on POST?** 201 tells the client a new resource now exists; the `Location` header gives its URL.
- **Why a whitelist for `order_by`?** Placeholders (`?`) work for values, not for column names. The column is chosen from a fixed list, so user input never becomes SQL text.
- **What is SQL injection and how is it prevented here?** Building SQL by joining user input lets an attacker change the query (`' OR 1=1 --`). All values use parameterised queries (`?`), so the input is always treated as data.
- **`LIKE '%sql%'` vs `=`?** `LIKE` matches patterns (`%` = any characters); `=` needs the whole value to match.
- **How does `BETWEEN` work?** `price BETWEEN 500 AND 700` means `price >= 500 AND price <= 700` (both ends included).
- **How does pagination work?** `LIMIT` = page size, `OFFSET` = rows to skip; page *n* has `offset = (n-1) * limit`.
- **PUT vs PATCH?** PUT replaces the whole record (all fields required, as here); PATCH changes only the fields sent.
- **Why validate on the server when the front end already checks?** Anyone can call the API directly (Postman, curl), so the server must never trust input.
- **Why a consistent error format?** Clients can handle every failure the same way: read `message`, check the status code.
- **Why `async`/`await`?** Database calls take time and return Promises; `await` waits for the real result.
- **Why is `.env` not committed?** It holds secrets and machine-specific settings; `.env.example` shows the variable names without real values.
