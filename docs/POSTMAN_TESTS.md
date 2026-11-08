# Postman test list

Collection: `postman/Lab03_Books_API.postman_collection.json` (variable `baseUrl` = `http://localhost:3000`).
Run the folders in order: **A. Success cases**, then **B. Failure cases**. Request 9 stores the new id in the `bookId` collection variable, which requests 10 to 12 and 25 to 26 use.
Result of the full run: **34 requests, 91 assertions, 0 failed**.

## A. Success cases

| # | Request | Expected status | What the tests check |
| --- | --- | --- | --- |
| 1 | `GET /books` | 200 | Defaults applied: limit 10, offset 0, at most 10 books |
| 2 | `GET /books?search_q=sql` | 200 | Every title contains "sql" (partial, case-insensitive) |
| 3 | `GET /books?order_by=price&order=DESC&limit=5` | 200 | Prices are in descending order |
| 4 | `GET /books?order_by=title&order=ASC&limit=5` | 200 | Titles are in A-Z order |
| 5 | `GET /books?limit=5&offset=5` | 200 | At most 5 books; offset echoed as 5 |
| 6 | `GET /books?min_price=500&max_price=700&limit=100` | 200 | All prices between 500 and 700 |
| 7 | `GET /books?search_q=sql&max_price=650&order_by=price&order=ASC` | 200 | Filters combine (search AND price) |
| 8 | `GET /books?search_q=zzzzzz` | 200 | No match is an empty list, not an error |
| 9 | `POST /books` | 201 | Book created, id returned, `Location` header set |
| 10 | `GET /books/{{bookId}}` | 200 | Returns the created book |
| 11 | `PUT /books/{{bookId}}` | 200 | Updated values returned |
| 12 | `DELETE /books/{{bookId}}` | 200 | "Book deleted successfully" |

## B. Failure cases

| # | Request | Expected status | Message contains |
| --- | --- | --- | --- |
| 13 | `POST /books` without title | 400 | `title is required` |
| 14 | `POST /books` without author | 400 | `author is required` |
| 15 | `POST /books` without price | 400 | `price is required` |
| 16 | `POST /books` with `"price": "abc"` | 400 | `price must be a number` |
| 17 | `POST /books` with `"price": -10` | 400 | `price must not be negative` |
| 18 | `POST /books` with `{}` | 400 | all three missing fields listed |
| 19 | `POST /books` with malformed JSON | 400 | `Invalid JSON in request body` |
| 20 | `PUT /books/1` with `"price": "free"` | 400 | `price must be a number` |
| 21 | `GET /books/abc` | 400 | `id must be a positive integer` |
| 22 | `GET /books/99999` | 404 | `not found` |
| 23 | `PUT /books/99999` | 404 | `not found` |
| 24 | `DELETE /books/99999` | 404 | `not found` |
| 25 | `DELETE /books/{{bookId}}` (already deleted) | 404 | `not found` |
| 26 | `GET /books/{{bookId}}` (after delete) | 404 | `not found` |
| 27 | `GET /books?order_by=password` | 400 | `order_by must be one of` |
| 28 | `GET /books?order=sideways` | 400 | `order must be ASC or DESC` |
| 29 | `GET /books?limit=abc` | 400 | `limit must be an integer` |
| 30 | `GET /books?offset=-1` | 400 | `offset must be an integer` |
| 31 | `GET /books?min_price=900&max_price=100` | 400 | `min_price must not be greater than max_price` |
| 32 | `GET /books?min_price=cheap` | 400 | `min_price must be a number` |
| 33 | `GET /books?search_q=' OR 1=1 --` | 200 | SQL injection is plain text: 0 results |
| 34 | `GET /authors` | 404 | `Route GET /authors not found` |

Every error test also checks that the body contains only `{ "message": "..." }`.
